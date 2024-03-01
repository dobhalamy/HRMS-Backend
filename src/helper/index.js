const moment = require('moment')
function camelize(str) {
  return str.replace(/\W+(.)/g, (match, chr) => chr.toUpperCase())
}
function formatObject(record) {
  const obj = {}
  const keys = Object.keys(record)
  keys.forEach((key) => {
    let formatKey = key
    formatKey = formatKey.replace('_', ' ')
    formatKey = camelize(formatKey)
    obj[formatKey] = record[key]
  })
  return obj
}
function formatKeys(data) {
  if (Array.isArray(data)) {
    const formattedKeys = data.map((record) => formatObject(record))
    return formattedKeys
  }
  return formatObject(data)
}

function localToUTC(date) {
  return new moment(date, 'YYYY-MM-DD').utc()
}

function formatDate(date) {
  return moment(date).format('YYYY-MM-DD')
}
// Returns an array of dates between the two dates
function getDates(startDate, endDate) {
  // const date = new Date(startDate.getTime())
  const date = new Date(startDate).toISOString()
  datePart = date.split('T')[0]
  let dateData = datePart
  // const date = new Date(startDate, 'YYYY-MM-DD')
  // const endDateOnly = new Date(endDate, 'YYYY-MM-DD')
  // const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateOnly = new Date(endDate).toISOString()
  const endDatePart = endDateOnly.split('T')[0]
  const dates = []

  while (dateData <= endDatePart) {
    dates.push(dateData)
    dateData = moment(dateData).add(1, 'day').format('YYYY-MM-DD');
    // const dateNew = moment(startDate.toISOString())
    // const dateNew = new Date(date).toDateString()
    // const formatDate = this.formatDate(dateNew)
    // const formatDate = date.toISOString()
    // const formatDate = new Date(dat)
    //dates.push(formatDate)
    // dates.push(dateData)
    // dateData = dateData + 1
    // datePart.setDate(datePart + 1)
    // date.setDate(date +1)
    //date.setDate(date.getDate())
  }
  return dates
}
// extract requested user id from the client request
const getRequestUserId = (req) => {
  const requestedUser = req?.headers?.userid || req?.user?.userId
  return parseInt(requestedUser)
}
// extract requested employee id from the client request
const getRequestEmpId = (req) => {
  const requestedUser = req?.headers?.empId || req?.user?.empId
  return requestedUser
}
// extract requested User Role from the client request
const getRequestUserRole = (req) => {
  const requestedUser = req?.headers?.userRole || req?.user?.userRole
  return requestedUser
}
const convertTotalMinutesToHours = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
  return hours
}
const convertTotalMinutesToMinutes = (totalMinutes) => {
  const minutes = totalMinutes % 60
  return minutes
}
// extract requested User Role from the client request
const getRequestUserDepInfo = (req) => {
  const requestedUser = {
    depId: req?.headers?.depId || req?.user?.depId,
    isConcernPerson: req?.headers?.isConcernPerson || req?.user?.isConcernPerson,
  }
  return requestedUser
}
const getMonth = (inputDate) => {
  const parts = inputDate.split('-')
  const month = parts[1]
  return month
}
const formatDateWithoutMoment = (inputDate) => {
  // Define a mapping of month abbreviations to month numbers
  const monthAbbreviations = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  }

  // Split the input date into day and month abbreviation
  const [day, monthAbbreviation] = inputDate.split('-')

  // Get the current year
  const currentYear = new Date().getFullYear()

  // Check if the month abbreviation is valid
  // eslint-disable-next-line no-prototype-builtins
  if (!monthAbbreviations.hasOwnProperty(monthAbbreviation)) {
    return 'Invalid month abbreviation'
  }

  // Get the month number from the abbreviation
  const month = monthAbbreviations[monthAbbreviation]

  // Create a new Date object with the current year, parsed month, and day
  const formattedDate = new Date(currentYear, month, parseInt(day))

  // Format the date as 'YYYY/MM/DD'
  const formattedYear = formattedDate.getFullYear()
  const formattedMonth = (formattedDate.getMonth() + 1).toString().padStart(2, '0')
  const formattedDay = formattedDate.getDate().toString().padStart(2, '0')

  const finalFormattedDate = `${formattedYear}/${formattedMonth}/${formattedDay}`
  return finalFormattedDate
}

// const checkingToatalWorkingHour = (totalTime) => {
//   // Create a Date object for the current date with the given totalTime
//   const totalTimeDate = new Date('1970-01-01T' + totalTime)

//   // Create a Date object for the threshold time (09:00:00)
//   const evenThirtyHourTimeDate = new Date('1970-01-01T07:30:00')

//   // Compare totalTimeDate with thresholdTimeDate
//   let status
//   if (!totalTimeDate || !evenThirtyHourTimeDate) {
//     status = 0
//   } else if (totalTimeDate < evenThirtyHourTimeDate) {
//     status = 0
//   } else {
//     status = 1
//   }

//   return status
// }
const isDayAndTimeWithinWorkingHours = (shiftTimingArray, dayName, timeIn, timeOut) => {
  // if (shiftTimingArray.hasOwnProperty(dayName.toLowerCase())) {
  const [shiftTimeIn, shiftTimeOut] = shiftTimingArray[dayName.toLowerCase()].split('-')

  // Convert the time strings to Date objects for easy comparison
  const timeInDate = new Date(`2023-09-25T${timeIn}`)
  const timeOutDate = new Date(`2023-09-25T${timeOut}`)
  const shiftTimeInDate = new Date(`2023-09-25T${shiftTimeIn}`)
  const shiftTimeOutDate = new Date(`2023-09-25T${shiftTimeOut}`)

  // Check if timeIn and timeOut are within the shift's time range
  const isWithinShiftTimings = timeInDate >= shiftTimeInDate && timeOutDate <= shiftTimeOutDate

  return isWithinShiftTimings // true or false
}
const calculateTotalTimeStaff = (timeIn, punchIn) => {
  const punchInParts = timeIn.split(':')
  const punchOutParts = punchIn.split(':')

  // Create Date objects for the two times
  const datePunchIn = new Date(0, 0, 0, punchInParts[0], punchInParts[1])
  const datePunchOut = new Date(0, 0, 0, punchOutParts[0], punchOutParts[1])

  // Calculate the time difference in milliseconds
  const timeDifference = datePunchOut - datePunchIn

  // Calculate hours, minutes, and seconds from the time difference
  const hours = Math.floor(timeDifference / 3600000) // 3600000 milliseconds in an hour
  const minutes = Math.floor((timeDifference % 3600000) / 60000) // 60000 milliseconds in a minute
  const seconds = Math.floor((timeDifference % 60000) / 1000) // 1000 milliseconds in a second

  // Format the result as "hh:mm:ss"
  const totalTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return totalTime
}

const calculateTotalTime = (userDownTimes, totalTime) => {
  // Convert userApr into milliseconds (assuming userApr is in "hh:mm:ss" format)
  const userAprTotalTime = totalTime.split(':')
  const userAprHours = parseInt(userAprTotalTime[0], 10)
  const userAprMinutes = parseInt(userAprTotalTime[1], 10)
  const userAprSeconds = parseInt(userAprTotalTime[2], 10)

  // Calculate the total milliseconds in userApr
  const userAprTotalMilliseconds =
    userAprHours * 60 * 60 * 1000 + userAprMinutes * 60 * 1000 + userAprSeconds * 1000

  // Calculate the total downtime duration in milliseconds
  const totalDowntimeMilliseconds = userDownTimes.reduce(
    (total, downtime) => total + (downtime.endTime - downtime.startTime),
    0,
  )

  // Calculate the total time in milliseconds
  let totalMilliseconds = userAprTotalMilliseconds + totalDowntimeMilliseconds

  // Calculate hours, minutes, and seconds from the total milliseconds
  const totalHours = Math.floor(totalMilliseconds / (60 * 60 * 1000))
  totalMilliseconds %= 60 * 60 * 1000

  const totalMinutes = Math.floor(totalMilliseconds / (60 * 1000))
  totalMilliseconds %= 60 * 1000

  const totalSeconds = Math.floor(totalMilliseconds / 1000)

  // Format the result as "hh:mm:ss"
  const formattedResult = `${totalHours.toString().padStart(2, '0')}:${totalMinutes
    .toString()
    .padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`
  return formattedResult
}
const formattedUtcTime = (inputTime) => {
  // The input timestamp in ISO 8601 format

  // Create a JavaScript Date object from the input timestamp
  const date = new Date(inputTime)

  // Get the hours and minutes from the Date object
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()

  // Format the hours and minutes as "HH:mm"
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`

  return formattedTime
}
const exceptionDatelist = (startDateStr, endDateStr) => {
  const dateFrom = new Date(startDateStr)
  const dateTo = new Date(endDateStr)

  const dateList = []

  // Create a loop that iterates from dateFrom to dateTo
  while (dateFrom <= dateTo) {
    const year = dateFrom.getFullYear()
    const month = String(dateFrom.getMonth() + 1).padStart(2, '0')
    const day = String(dateFrom.getDate()).padStart(2, '0')
    const formattedDate = `${year}/${month}/${day}`

    dateList.push(formattedDate)

    dateFrom.setDate(dateFrom.getDate() + 1)
  }

  return dateList
}
const calculateTotalTimeException = (accessIn, accessOut) => {
  const timeIn = new Date(accessIn)
  const timeOut = new Date(accessOut)
  const timeDifferenceInMilliseconds = timeOut - timeIn
  const hours = Math.floor(timeDifferenceInMilliseconds / 3600000)
  const remainingMilliseconds = timeDifferenceInMilliseconds % 3600000
  const minutes = Math.floor(remainingMilliseconds / 60000)
  const seconds = Math.floor((remainingMilliseconds % 60000) / 1000)

  const formattedDifference = `${hours}:${minutes}:${seconds}`

  return formattedDifference
}
const utcToIst = (utc) => {
  const ist = moment.utc(utc).local().format('hh:mm A')
  return ist
}
const getWeekend = (daysInMonth, month, year, holidays) => {
  const weekends = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day, 12, 0, 0)

    // Check if the date is a weekend (Saturday or Sunday)
    if (date.getDay() === 0 || date.getDay() === 6) {
      weekends.push(date)
    }

    // Convert the date to a string in the format YYYY-MM-DD for comparison with holidays
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`

    // Check if the date is a holiday by comparing with the 'date' property in the holidays array
    if (holidays.some((holiday) => holiday.date === dateString)) {
      weekends.push(date)
    }
  }

  return weekends
}
const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' }

const empAttribute = [
  `userId`,
  // `tenantId`,
  `empId`,
  `userName`,
  `userPersonalEmail`,
  `userEmail`,
  // `userPassword`,
  `userDesignation`,
  `userRole`,
  // `userProcess`,
  `userProfileImg`,
  `empMobileNumber`,
  `userBirthday`,
  `empJoinDate`,
  `empSalary`,
  `empCurrentAddress`,
  `empPermanentAddress`,
  // `userResetPasswordOtp`,
  // `userResetPasswordOtpTime`,
  // `isConcernPerson`,
  `depId`,
  `isActive`,
  `isDeleted`,
  // `userLocked`,
  // `createdAt`,
  // `updatedAt`,
]

module.exports = {
  dateOptions,
  formatKeys,
  localToUTC,
  getDates,
  formatDate,
  getWeekend,
  getRequestUserId,
  getRequestEmpId,
  getRequestUserRole,
  getRequestUserDepInfo,
  empAttribute,
  formatDateWithoutMoment,
  // checkingToatalWorkingHour,
  calculateTotalTimeStaff,
  calculateTotalTime,
  formattedUtcTime,
  exceptionDatelist,
  calculateTotalTimeException,
  utcToIst,
  getMonth,
  isDayAndTimeWithinWorkingHours,
  convertTotalMinutesToHours,
  convertTotalMinutesToMinutes,
}
