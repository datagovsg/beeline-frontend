import datePickerTemplate from './datePicker.html'
import _ from 'lodash'

var monthNames = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');

function DatePickerDirective(DateService) {
    function link($scope, elem, attrs) {
        $scope.selectedDates = [];
        $scope.startDate = new Date($scope.startDate || '2015-01-01')
        $scope.startDate.setDate(1);
        $scope.startYear =  typeof $scope.startYear == 'undefined'
                                ? DateService.date.getUTCFullYear()
                                : parseInt($scope.startYear);
        $scope.startMonth =  typeof $scope.startMonth == 'undefined'
                                ? DateService.date.getUTCMonth()
                                : parseInt($scope.startMonth);

        $scope.displayYears = [
            DateService.date.getUTCFullYear(),
            DateService.date.getUTCFullYear() + 1,
        ];
        $scope.displayMonths = _.range(0,12);

        $scope.monthNames = monthNames;

        $scope.$watchGroup(['startYear', 'startMonth'], function() {
            $scope.startDate = new Date(Date.UTC(parseInt($scope.startYear),
                                                parseInt($scope.startMonth), 1));
        });

        $scope.updateAvailability = function () {
            var realStart = new Date($scope.startDate.getTime() - $scope.startDate.getUTCDay()*24*60*60*1000);

            // sort them
            // This step can be optimized by caching the sort (btw)
            var objValidDates = {}; //_.sortBy($scope.validDates);
            var objExhaustedDates = {}; //_.sortBy($scope.exhaustedDates);
            var objInvalidStopDates = {}; //_.sortBy($scope.invalidStopDates);

            console.log('updateAvailability()!');

            if ($scope.validDates) {
                for (let dt of $scope.validDates)
                    objValidDates[dt.getTime()] = true;
            }
            if ($scope.exhaustedDates) {
                for (let dt of $scope.exhaustedDates)
                    objExhaustedDates[dt.getTime()] = true;
            }
            if ($scope.invalidStopDates) {
                for (let dt of $scope.invalidStopDates)
                    objInvalidStopDates[dt.getTime()] = true;
            }

            //console.log($scope);
            //console.log(objValidDates);

            $scope.weeks = [];
            for (let week = 0; week < 6; week++) {
                $scope.weeks.push([]);
                for (let day = 0; day < 7; day++) {
                    let dayData = {
                        time: realStart.getTime() + 24 * 60 * 60 * 1000 * (week *  7 + day)
                    };
                    dayData.date = new Date(dayData.time);

                    $scope.weeks[week].push(dayData);

                    // check the other properties
                    dayData.isValid = dayData.time in objValidDates;
                    dayData.isExhausted = dayData.time in objExhaustedDates;
                    dayData.isInvalidStop = dayData.time in objInvalidStopDates;
                    dayData.isPrimaryMonth = dayData.date.getUTCMonth() == $scope.startDate.getUTCMonth();
                    dayData.isWeekend = dayData.date.getUTCDay() == 0 || dayData.date.getUTCDay() == 6;
                }
            }
        }; /* updateAvailability() */
        $scope.$watchGroup([
            'startDate', 'validDates', 'exhaustedDates',
            'invalidStopDates','selectedDates'],
            () => $scope.updateAvailability()
            );
        $scope.updateAvailability();

        // functions
        $scope.selectDate = function (date) {
            var i;
            if ((i = $scope.selectedDates.indexOf(date.time)) == -1) {
            $scope.selectedDates.push(date.time);
          }
          else {
            $scope.selectedDates.splice(i,1);
          }
        }

        /**
            How to paint a day. Consider you have the following possibilities:

            1. In selection
            2. In the middle of a drag
            3. In the middle of a new selection

            4. An invalid date (e.g. public holiday, service not running)
            5. An "exhausted" date (e.g. seats sold out)
            6. A date with invalid stops selected

        **/
        $scope.dateClasses = function (day) {
            var isInSelection = $scope.selectedDates.indexOf(day.time) != -1;
            var isDragging = ($scope.state.dragStart != null && $scope.state.dragEnd != null);
            var isInNewSelection = isDragging &&
                                    $scope.state.dragFirst.time <= day.time &&
                                    day.time <= $scope.state.dragLast.time;
            var isValid = day.isValid && !day.isExhausted && !day.isInvalidStop;

            return ((isValid && isInSelection && isInNewSelection) ? 'selected dragged'
                  :(isValid && isInSelection && !isInNewSelection) ? 'selected'
                  :(isValid && !isInSelection && isInNewSelection) ? 'dragged'
                  :(isValid && !isInSelection && !isInNewSelection) ? ''
                  :/* invalid days... why? */ [(day.isValid ? '' : 'not-running'),
                                               (day.isExhausted ? 'sold-out' : ''),
                                               (day.isInvalidStop ? 'invalid-stop' : ''),
                                               ].join(' '))
                    + (day.isWeekend ? ' weekend' : '')
                    + (day.isPrimaryMonth ? ' primary' : '')

        }

        $scope.previousMonth = function () {
            $scope.startDate.setMonth($scope.startDate.getUTCMonth() - 1);
            $scope.startMonth = $scope.startDate.getUTCMonth();
            $scope.startYear = $scope.startDate.getUTCFullYear();
        };
        $scope.nextMonth = function () {
            $scope.startDate.setMonth($scope.startDate.getUTCMonth() + 1);
            $scope.startMonth = $scope.startDate.getUTCMonth();
            $scope.startYear = $scope.startDate.getUTCFullYear();
        };

        // event handlers...
        $scope.state = {
            dragStart: null,
            dragEnd: null,
            dragLast: null,
            dragFirst: null,
        };
        function computeFirstLastDates() {
            if ($scope.state.dragStart == null ||
                    $scope.state.dragEnd == null) {
                $scope.state.dragFirst = $scope.state.dragLast = null;
                return;
            }

            if ($scope.state.dragStart.date.getTime() < $scope.state.dragEnd.date.getTime()) {
                $scope.state.dragFirst = $scope.state.dragStart;
                $scope.state.dragLast = $scope.state.dragEnd;
            }
            else {
                $scope.state.dragLast = $scope.state.dragStart;
                $scope.state.dragFirst = $scope.state.dragEnd;
            }
        }
        $scope.beginTouch = function(day, event) {
            $scope.state.dragStart = day;
            $scope.state.dragEnd = day;
            computeFirstLastDates()
        };
        $scope.moveTouch = function (day, event) {
			var selElem = document.elementFromPoint(event.touches[0].pageX, event.touches[0].pageY)
			if (selElem == null)
				return;
            var selDate = new Date(parseInt(selElem.dataset.date))
            $scope.state.dragEnd = {
                date: selDate,
				time: selDate.getTime(),
            };

            computeFirstLastDates()

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        $scope.endTouch = function (day, event) {
            $scope.endSelection(null, event);
            computeFirstLastDates()
        };
        $scope.beginSelection = function(day, event) {
            $scope.state.dragStart = day;
            computeFirstLastDates()

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        $scope.dragSelection = function(day, event) {
            if ($scope.state.dragStart && (!event || !event.buttons)) {
                if ($scope.state.dragEnd) {
                    return $scope.endSelection($scope.state.dragEnd)
                }
                else {
                    return $scope.endSelection(day);
                }
            }
            else if (event && event.buttons && !$scope.state.dragStart) {
                $scope.beginSelection(day);
            }
            $scope.state.dragEnd = day;
            computeFirstLastDates()
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        $scope.endSelection = function(day, event) {
            for (let week of $scope.weeks) {
                for (let day of week) {
                    if (day.time >= $scope.state.dragFirst.time
                            && day.time <= $scope.state.dragLast.time
                            && day.isValid && !day.isExhausted && !day.isInvalidStop) {

                        var i;
                        if ((i = $scope.selectedDates.indexOf(day.time)) == -1) {
                            $scope.selectedDates.push(day.time);
                        }
                        else {
                            $scope.selectedDates.splice(i, 1);
                        }
                    }
                }
            }
            $scope.state.dragStart = null;
            $scope.state.dragEnd = null;
            computeFirstLastDates()

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
    }

    return {
        restrict: 'E',
        scope: {
            selectedDates: '=dates',
            startDate: '=',
            startYear: '=',
            startMonth: '=',
            minDate: '=',
            maxDate: '=',
            validDates: '=',
            exhaustedDates: '=',
            invalidStopDates: '=',
            numWeeks: '=',
        },
        template: datePickerTemplate,
        link: link,
    }
}

function TouchDirective(which) {
    return () => ({
        link: function (scope, element, attr) {
            element.on(which, function (event) {
                scope.$event = event;
                scope.$apply(function() {
                    var attrName = 'my' + which[0].toUpperCase() + which.substr(1);
                    scope.$eval(attr[attrName])
                });
                scope.$event = null;
            });
        },
    });
}


export var DatePicker = ['DateService', DatePickerDirective];
export var TouchStart = TouchDirective('touchstart');
export var TouchEnd = TouchDirective('touchend');
export var TouchMove = TouchDirective('touchmove');
export var MouseMove = TouchDirective('mousemove');
