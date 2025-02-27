import asyncHandler from "../utils/asyncHandler.js";
import SensorData from "../models/sensorDataModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

// ✅ Retrieve Device Data with Aggregation
export const getDeviceData = asyncHandler(async (req, res) => {
    // Destructure fields from the request body
    const { productId, slaveId, date, startTime, endTime, limit = 200, page = 1 } = req.body;
    console.log(req.body);

    // 🔹 Validate required fields:
    // If date is missing, both startTime and endTime must be provided.
    if (!productId || slaveId === undefined || (!date && (!startTime || !endTime))) {
        return errorResponse(res, "Missing required fields", 400);
    }

    // 🔹 Determine the time range:
    let startDate, endDate;
    if (date) {
        // If 'date' is provided, use it to create start and end of day boundaries.
        startDate = new Date(date + "T00:00:00.000Z");
        endDate = new Date(date + "T23:59:59.999Z");
    } else {
        // If 'date' is missing but startTime and endTime are provided,
        // add a 15-minute margin: subtract 15 minutes from startTime and add 15 minutes to endTime.
        startDate = new Date(new Date(startTime).getTime() - 15 * 60 * 1000);
        endDate = new Date(new Date(endTime).getTime() + 15 * 60 * 1000);
    }
    console.log(startDate, endDate);

    // 🔹 Pagination setup
    const skip = (page - 1) * limit;

    // 🔹 Aggregation pipeline to filter, sort, and paginate the data
    const pipeline = [
        { 
            $match: { 
                productId: productId, 
                slaveId: slaveId, 
                timestamp: { $gte: startDate, $lte: endDate } 
            } 
        },
        { $sort: { timestamp: -1 } }, // Latest data first
        { 
            $facet: {
                metadata: [{ $count: "totalCount" }], // Total count of documents
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
        }
    ];

    // 🔹 Execute aggregation
    const result = await SensorData.aggregate(pipeline);
    const totalCount = result[0].metadata[0]?.totalCount || 0;
    const data = result[0].data;
    console.log(result);
    
    return successResponse(
        res, 
        { totalCount, limit, page, data }, 
        "Device data retrieved successfully", 
        200
    );
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
        const adjustedStartTime = new Date(new Date(startTime).getTime() - 60 * 60 * 1000); // Subtract 1 hour
        const adjustedEndTime = new Date(new Date(endTime).getTime() + 60 *  60 * 1000);   // Add 1 hour

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
    
        // Step 2: Sort Data by Timestamp
        { 
            $sort: { timestamp: 1 } 
        },
    
        // Step 3: Use $accumulator to Assign Period IDs Dynamically
        {
            $group: {
                _id: null,
                readings: {
                    $push: {
                        timestamp: "$timestamp",
                        currentFlow: "$currentFlow",
                        totalFlow: "$totalFlow" // Capture totalFlow for later reference
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
                                                    { $eq: ["$$this.currentFlow", 0] },
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
                                    if: { $eq: ["$$this.currentFlow", 0] },
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
    
        // Step 4: Unwind the extracted periods
        { 
            $unwind: "$readings.periods"
        },
    
        // Step 5: Calculate statistics for each period
        {
            $project: {
                startTime: { $arrayElemAt: ["$readings.periods.timestamp", 0] },
                endTime: { $arrayElemAt: ["$readings.periods.timestamp", -1] },
                totalWaterMeasured: { 
                    $sum: "$readings.periods.currentFlow" 
                },
                totalFlowAtStart: { $subtract: [{ $arrayElemAt: ["$readings.periods.totalFlow", 0] }, { $arrayElemAt: ["$readings.periods.currentFlow", 0] }] }, // Capture totalFlow at start
                totalFlowAtEnd: { $arrayElemAt: ["$readings.periods.totalFlow", -1] }, // Capture totalFlow at end
                avgFlowRate: { 
                    $avg: "$readings.periods.currentFlow" 
                },
                maxFlowRate: { 
                    $max: "$readings.periods.currentFlow" 
                },
                minFlowRate: { 
                    $min: "$readings.periods.currentFlow" 
                },
                readingCount: { 
                    $size: "$readings.periods" 
                }
            }
        },
    
        // Step 6: Calculate Duration
        {
            $project: {
               _id:0,
                startTime: 1,
                endTime: 1,
                durationMinutes: { 
                    $divide: [
                        { $subtract: ["$endTime", "$startTime"] }, 
                        1000 * 60 // Convert milliseconds to minutes
                    ] 
                },
                totalWaterMeasured: 1,
                totalFlowAtStart: 1,
                totalFlowAtEnd: 1,
                avgFlowRate: 1,
                maxFlowRate: 1,
                minFlowRate: 1,
                readingCount: 1
            }
        },
    
        // Step 7: Sort Periods by Start Time
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
