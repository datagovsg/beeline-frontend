import suggestionItemTemplate from './suggestionItem.html'
import moment from 'moment'
import _ from 'lodash'

angular.module('beeline').directive('suggestionItem', [
  function () {
    return {
      restrict: 'E',
      replace: false,
      scope: {
        suggestion: '<',
      },
      template: suggestionItemTemplate,
      link: function ($scope, element, attr) {
        $scope.parseTime = function (time) {
          let hours = moment.duration(time).hours()
          let suffix = hours > 11 ? 'PM' : 'AM'
          hours = hours > 11 ? hours - 12 : hours
          if (hours === 0) hours = 12
          let minutes = moment.duration(time).minutes()
          minutes = minutes < 10 ? '0' + minutes : minutes
          return hours + '.' + minutes + ' ' + suffix
        }

        $scope.parseSchedule = function (daysOfWeek) {
          if (!daysOfWeek) return
          let week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          let weekday = {
            Mon: true,
            Tue: true,
            Wed: true,
            Thu: true,
            Fri: true,
            Sat: false,
            Sun: false,
          }
          let weekend = {
            Mon: false,
            Tue: false,
            Wed: false,
            Thu: false,
            Fri: false,
            Sat: true,
            Sun: true,
          }

          if (_.isEqual(daysOfWeek, weekday)) return 'Mon to Fri (Exclude P.H.)'
          else if (_.isEqual(daysOfWeek, weekend)) return 'Sat, Sun (Exclude P.H.)'
          else return _.filter(week, d => daysOfWeek[d]).join(', ')
        }
      },
    }
  },
])
