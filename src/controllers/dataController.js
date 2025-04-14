import asyncHandler from "../utils/asyncHandler.js";
import SensorData from "../models/sensorDataModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

// ✅ Retrieve Device Data with Aggregation
export const getDeviceData = asyncHandler(async (req, res) => {
    const { productId, slaveId, date, startTime, endTime, limit = 200, page = 1 } = req.body;
    console.log(req.body);

    // 🔹 Validate required fields:
    if (!productId || slaveId === undefined || (!date && (!startTime || !endTime))) {
        return errorResponse(res, "Missing required fields", 400);
    }

    // 🔹 Determine the time range:
    let startDate, endDate;
    if (date) {
        startDate = new Date(date + "T00:00:00.000Z");
        endDate = new Date(date + "T23:59:59.999Z");
    } else {
        startDate = new Date(new Date(startTime).getTime() - 5 * 60 * 1000); // Subtract 5 mins
        endDate = new Date(new Date(endTime).getTime() + 5 * 60 * 1000); // Add 5 mins
    }
    console.log(startDate, endDate);

    // 🔹 Base aggregation pipeline (filter + sort)
    const pipeline = [
        {
            $match: {
                productId: productId,
                slaveId: slaveId,
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        { $sort: { timestamp: -1 } }, // Latest data first
    ];

    // 🔹 Add pagination only when 'date' is provided:
    if (date) {
        const skip = (page - 1) * limit;

        pipeline.push({
            $facet: {
                metadata: [{ $count: "totalCount" }],
                data: [
                    { $skip: skip },
                    { $limit: parseInt(limit) },
                    {
                        $project: {
                            _id: 0,
                            productId: 1,
                            timestamp: 1,
                            currentFlow: 1,
                            totalFlow: 1,
                            deviceLabel: 1,
                            slaveId: 1,
                            gsmRange: 1
                        }
                    }
                ]
            }
        });

        const result = await SensorData.aggregate(pipeline);
        const totalCount = result[0].metadata[0]?.totalCount || 0;
        const data = result[0].data;

        return successResponse(
            res,
            { totalCount, limit, page, data },
            "Device data retrieved successfully",
            200
        );
    } else {
        // 🔹 If startTime and endTime are provided → Return all matching records
        pipeline.push({
            $project: {
                _id: 0,
                productId: 1,
                timestamp: 1,
                currentFlow: 1,
                totalFlow: 1,
                deviceLabel: 1,
                slaveId: 1,
                gsmRange: 1
            }
        });

        const data = await SensorData.aggregate(pipeline);

        return successResponse(
            res,
            { totalCount: data.length, data },
            "Device data retrieved successfully",
            200
        );
    }
});




export const getFlowPeriodsDayWise = async (req, res) => {
    const { productId, slaveId, date, startTime, endTime } = req.body;

    if (!productId  || slaveId === undefined) {
        return errorResponse(res, "Missing required parameters", 400);
    }

    // Base match condition
    let matchStage = { productId, slaveId };

    // Case 1: If 'date' is provided, filter for the whole day
    if (date) {
        matchStage.timestamp = {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`)
        };
    }

    // Case 2: If 'startTime' and 'endTime' are provided, filter by time range
       else if (startTime && endTime) {
        const adjustedStartTime = new Date(new Date(startTime).getTime() - 5 * 60 * 1000); // Subtract 1 hour
        const adjustedEndTime = new Date(new Date(endTime).getTime() + 5 *  60 * 1000);   // Add 1 hour

        matchStage.timestamp = {
            $gte: adjustedStartTime,
            $lte: adjustedEndTime
        };
    }

    const aggregationPipeline =  [
        // Step 1: Filter data for the given productId
        { 
          $match: matchStage 
        },
      
        // Step 2: Sort data by timestamp
        { 
          $sort: { timestamp: 1 } 
        },
      
        // Step 3: Use $accumulator logic to segment flow periods
        {
          $group: {
            _id: null,
            readings: {
              $push: {
                timestamp: "$timestamp",
                currentFlow: "$currentFlow",
                totalFlow: "$totalFlow"
              }
            }
          }
        },
        {
          $project: {
            readings: {
              $reduce: {
                input: "$readings",
                initialValue: {
                  periods: [],
                  currentPeriod: [],
                  lastFlow: 0
                },
                in: {
                  periods: {
                    $concatArrays: [
                      "$$value.periods",
                      {
                        $cond: {
                          if: {
                            $and: [
                              { $lt: ["$$this.currentFlow", 1] },
                              { $gt: [{ $size: "$$value.currentPeriod" }, 0] }
                            ]
                          },
                          then: ["$$value.currentPeriod"],
                          else: []
                        }
                      }
                    ]
                  },
                  currentPeriod: {
                    $cond: {
                      if: { $lt: ["$$this.currentFlow", 1] },
                      then: [],
                      else: { $concatArrays: ["$$value.currentPeriod", ["$$this"]] }
                    }
                  },
                  lastFlow: "$$this.currentFlow"
                }
              }
            }
          }
        },
      
        // Step 4: Unwind periods
        { 
          $unwind: "$readings.periods" 
        },
      
        // Step 5: Compute stats for each period
        {
          $project: {
            startTime: { $arrayElemAt: ["$readings.periods.timestamp", 0] },
            endTime: { $arrayElemAt: ["$readings.periods.timestamp", -1] },
            totalWaterMeasured: { $subtract: [{ $arrayElemAt: ["$readings.periods.totalFlow", -1] } , { $arrayElemAt: ["$readings.periods.totalFlow", 0] }] },
            totalFlowAtStart: {
              $subtract: [
                { $arrayElemAt: ["$readings.periods.totalFlow", 0] },
                { $arrayElemAt: ["$readings.periods.currentFlow", 0] }
              ]
            },
            totalFlowAtEnd: { $arrayElemAt: ["$readings.periods.totalFlow", -1] },
            avgFlowRate: { $avg: "$readings.periods.currentFlow" },
            maxFlowRate: { $max: "$readings.periods.currentFlow" },
            minFlowRate: { $min: "$readings.periods.currentFlow" },
            readingCount: { $size: "$readings.periods" }
          }
        },
      
        // Step 6: Calculate Duration
        {
          $project: {
            _id: 0,
            startTime: 1,
            endTime: 1,
            durationMinutes: {$round: [{
                $divide: [
                  { $subtract: ["$endTime", "$startTime"] },
                  1000 * 60
                ]
              }, 2]} ,
              totalWaterMeasured: {
                $round: [
                  { $subtract: ["$totalFlowAtEnd", "$totalFlowAtStart"] },
                  2
                ]
              },
            totalFlowAtStart: { $round: ["$totalFlowAtStart", 2] },
            totalFlowAtEnd: { $round: ["$totalFlowAtEnd", 2] },
            avgFlowRate: { $round: ["$avgFlowRate", 2] },
            maxFlowRate: { $round: ["$maxFlowRate", 2] },
            minFlowRate: { $round: ["$minFlowRate", 2] },
            readingCount: 1,
          }
        },
      
        {
            $match: {
              totalWaterMeasured: { $gt: 1 },
              durationMinutes: { $gte: 1 }, // Minimum duration of 1 minute
              avgFlowRate: { $gte: 0.5 },   // Ignore near-zero flows
              maxFlowRate: { $lte: 1000 }   // Example threshold for outliers
            }
          },
          
          // Step 9: Sort the valid periods by start time
          {
            $sort: { startTime: -1 }
          }
      ];

    SensorData.aggregate(aggregationPipeline)
        .then(flowPeriods => successResponse(res, "Flow periods retrieved successfully", { productId, slaveId, date, flowPeriods }))
        .catch(error => errorResponse(res, "Error retrieving flow periods", 500, error));
};


export const getDates = async (req, res) => {
    const { productId, slaveId } = req.body;

    if (!productId  || slaveId === undefined) {
        return errorResponse(res, "Missing required parameters", 400);
    }
    const pipeline = [
        {
            $match: {
                productId,
                slaveId
            }
        },
        {
            $project: {
                date: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$timestamp"
                    }
                }
            }
        },
        {
            $group: {
                _id: "$date",
                totalFrames: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                totalFrames: 1
            }
        },
        {
            $sort: { date: 1 }
        }
    ];

    try {
        const result = await SensorData.aggregate(pipeline);
        return successResponse(res, "Captured dates retrieved successfully", result);
    } catch (error) {
        return errorResponse(res, "Failed to retrieve captured dates", error);
    }
};
