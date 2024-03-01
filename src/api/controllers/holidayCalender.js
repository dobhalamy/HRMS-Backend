const { BadRequest, NotFound } = require('../../helper/apiErrors');
const HttpStatusCode = require('../../enums/httpErrorCodes');
const { logger } = require('../../helper');

const db = require('../models/index');
const HolidayCalender = db.holidayCalender;

const getAllHolidays = async (req, res) => {
  const { skip = 0, limit = 10 } = req.query;

  try {
    const allHolidays = await HolidayCalender.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
    });

    const holidaysTotalCount = await HolidayCalender.count();
    if (allHolidays) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          holidayList: allHolidays,
          totalCount: holidaysTotalCount,
        },
      });

      logger.info({
        controller: 'holidayCalender',
        method: 'getAllHolidays',
        msg: 'All holidays data retrieved successfully',
      });
    }
  } catch (error) {
    logger.error({
      controller: 'holidayCalender',
      method: 'getAllHolidays',
      msg: `Catch error: ${error?.message}`,
    });

    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      });
    }
  }
};

const addHoliday = async (req, res) => {
  const { name, date } = req.body;

  try {
    if (!name || !date) {
      throw new BadRequest();
    }

    const isCreated = await HolidayCalender.create({
      name,
      date,
      createdAt: new Date(),
    });

    if (isCreated) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: isCreated,
        statusCode: HttpStatusCode.OK,
      });

      logger.info({
        controller: 'holidayCalender',
        method: 'addHoliday',
        msg: 'Holiday added successfully',
      });
    }
  } catch (error) {
    logger.error({
      controller: 'holidayCalender',
      method: 'addHoliday',
      msg: `Catch error: ${error?.message}`,
    });

    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      });
    }
  }
};

const deleteHoliday = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      throw new BadRequest();
    }

    const deletedRows = await HolidayCalender.destroy({
      where: { id },
    });

    if (deletedRows > 0) {
      res.json({
        status: true,
        message: 'Holiday deleted successfully',
      });

      logger.info({
        controller: 'holidayCalender',
        method: 'deleteHoliday',
        msg: 'Holiday deleted successfully',
      });
    } else {
      throw new NotFound(null, null, null, 'Holiday not found');
    }
  } catch (error) {
    logger.error({
      controller: 'holidayCalender',
      method: 'deleteHoliday',
      msg: `Catch error: ${error?.message}`,
    });

    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      });
    }
  }
};

const updateHoliday = async (req, res) => {
  const { id } = req.params;
  const { name, date } = req.body;

  try {
    if (!id || !name || !date) {
      throw new BadRequest();
    }

    const isExists = await HolidayCalender.findByPk(id);

    if (!isExists) {
      throw new NotFound(null, null, null, 'Holiday not found');
    }

    const isUpdated = await HolidayCalender.update(
      {
        name,
        date,
        updatedAt: new Date(),
      },
      {
        where: { id },
        returning: true,
      }
    );

    if (isUpdated) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: isUpdated[1][0],
      });

      logger.info({
        controller: 'holidayCalender',
        method: 'updateHoliday',
        msg: 'Holiday updated successfully',
      });
    }
  } catch (error) {
    logger.error({
      controller: 'holidayCalender',
      method: 'updateHoliday',
      msg: `Catch error: ${error?.message}`,
    });

    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      });
    }
  }
};

module.exports = {
  getAllHolidays,
  addHoliday,
  deleteHoliday,
  updateHoliday,
};
