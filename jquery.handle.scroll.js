$.fn.handleScroll = function(obj) {

    // extend a manager instance from obj
    // return it in plugin instantiation
    // allow user to see/set ALL manager properties

    var ctrl = obj;
    ctrl.wrapper = this[0];
    ctrl.$wrapper = this.css({
        overflow: 'hidden',
        cursor: '-webkit-grab',
    });

    // some common functions

    var between = function(val, min, max) {
        if (val < min) return min;
        if (val > max) return max;
        return val;
    };

    var elapsedTime = function(from, to, inSeconds) {
        var milliseconds = (to || new Date) - from;
        return inSeconds ? milliseconds / 1000 : milliseconds;
    };

    ctrl.getY = function(e) {
        if (typeof e.pageY !== 'number') {
            e = e.originalEvent;
            e = e.touches[0] || e.changedTouches[0];
        }
        return e.pageY;
    };

    ctrl.validElements = function($elements) {
        return $elements.filter(function() {
            var $this = $(this);
            if ($this.is(':hidden')) {
                return false;
            }
            if (['relative', 'static'].indexOf($this.css('position')) === -1) {
                return false;
            }
            return true;
        });
    };

    // The below function get all scrollTop positions from arrayFnSpaces:
    //  - first item: must be a function, the fnUserAction
    //  - when number: consider as scrollTop
    //  - when string: consider as selector and add each match's scrollTop
    //  - else: discard with warn alert in the console
    // make sure there is a start limit
    // sort the array, so the spaces can be calculated
    // make sure there is an end limit
    // remove duplicated scrollTop positions

    function getPoints() {
        ctrl.points = (ctrl.arrayFnSpaces || [function() {}]).slice();
        if (typeof ctrl.points[0] === 'function') {
            ctrl.userAction = ctrl.points.shift();
        } else {
            console.error('arrayFnSpaces[0], missing function');
        }
        for (var i = 0; i < ctrl.points.length;) {
            switch (typeof ctrl.points[i]) {
                case 'number':
                    i++;
                    break;
                case 'string':
                    var selector = ctrl.points.splice(i, 1)[0];
                    ctrl.$wrapper.find(selector).each(function() {
                        var top = 0;
                        ctrl.validElements($(this).prevAll()).each(function() {
                            top += $(this).outerHeight(true);
                        });
                        ctrl.points.splice(i++, 0, top);
                    });
                    break;
                default:
                    var error = JSON.stringify(ctrl.points.splice(i, 1)[0]);
                    console.warn('arrayFnSpaces, unexpected: ' + error);
                    break;
            }
        }
        ctrl.points.unshift(0);
        ctrl.points.sort(function(x, y) {
            return x - y;
        });
        ctrl.points.push(Infinity);
        ctrl.points = ctrl.points.filter(function(x, i, a) {
            return x !== a[i - 1];
        });
        ctrl.numSpaces = ctrl.points.length - 1;
    };

    // prepare the scrollbar environment if exists
    ctrl.scrollbar = $(ctrl.scrollbar);
    if (ctrl.scrollbar.length) {
        ctrl.scrollbar.detach().appendTo('body');
        ctrl.scrollbar.css({
            position: 'absolute',
            left: ctrl.$wrapper.offset().left + ctrl.$wrapper.width(),
        });
    }

    // events to be blocked
    var preventEvents = 'scroll';
    var prevent = function(e) {
        typeof e.preventDefault === 'function' && e.preventDefault();
        // typeof e.stopPropagation === 'function' && e.stopPropagation();
    };

    // function to get actual space (TODO: test some binary search algorithms)
    ctrl.getSpace = function(y) {
        for (var i = 0; i < ctrl.points.length; i++) {
            if (y < ctrl.points[i]) {
                return i;
            }
        }
        return ctrl.points.length;
    };

    // handle what to do before handling scroll
    var downEvents = 'mousedown touchstart';
    var touchStarted;
    var startAtTop;
    var startY;
    ctrl.fnDown = function(e) {
        prevent(e);
        startY = ctrl.getY(e);
        startAtTop = ctrl.wrapper.scrollTop;
        touchStarted = new Date;
        ctrl.$wrapper.on(moveEvents, ctrl.fnMove);
    };
    
    // handle scroll
    var moveEvents = 'mousemove touchmove';
    var height = ctrl.$wrapper.outerHeight(true);
    var offTop = ctrl.$wrapper.offset().top;
    var barMaxTop = height - ctrl.scrollbar.outerHeight(true);
    var maxTop = -height; // the final value is calculated on `init`
    var running = false;
    var lastRun;
    var distance;
    ctrl.fnMove = function(e) {
        if (running) {
            return;
        }
        running = true;
        window.requestAnimationFrame(function() {
            lastRun = new Date;
            distance = startY - ctrl.getY(e);
            ctrl.$wrapper.scrollTop(between(startAtTop + distance, 0, maxTop));
            ctrl.scrollbar.css({
                top: ctrl.wrapper.scrollTop / maxTop * barMaxTop + offTop,
                display: 'block',
            });
            ctrl.space = ctrl.getSpace(ctrl.wrapper.scrollTop);
            running = false;
            if (ctrl.space !== ctrl.lastSpace) {
                ctrl.lastSpace = ctrl.space;
                ctrl.userAction();
            }
        });
    };

    // handle what to do on scroll handled end
    var upEvents = 'mouseup touchend mouseleave';
    ctrl.fnUp = function(e) {
        ctrl.$wrapper.off(moveEvents, ctrl.fnMove);
        if (ctrl.smoothEffect && elapsedTime(lastRun) < 200) {
            var totalTime = elapsedTime(touchStarted, null, 'seconds');
            newTime = between(totalTime, 2, totalTime);
            fnSmoothEffect(ctrl.getY(e), distance / newTime, 20);
        }
    };

    // bounce effect function when `elastic` property is true
    var fnSmoothEffect = function(y, slip, delay) {
        var elasticStarted = new Date;
        var counter = Math.sqrt(Math.abs(slip) | 0) | 0;
        var slipX = slip / counter;
        (function effect(counter, i) {
            var scrollEnded = elapsedTime(touchStarted, elasticStarted) < 0;
            if (!counter || scrollEnded) {
                return;
            }
            setTimeout(function() {
                ctrl.fnMove({ pageY: y - slipX * i });
                effect(counter - 1, i + 1);
            }, delay);
        })(counter, 1);
    };

    // attach events
    var bind = {};
    bind[downEvents] = ctrl.fnDown;
    bind[upEvents] = ctrl.fnUp;
    bind[preventEvents] = prevent;
    bind.mousewheel = function(e) {
        var diff = e.originalEvent.wheelDelta < 0 ? 60 : -60;
        ctrl.moveToPos(ctrl.wrapper.scrollTop + diff);
    };
    ctrl.$wrapper.on(bind);

    // allow user to move to a specific scrollTop position
    ctrl.moveToPos = function(y) {
        ctrl.fnDown({ pageY: 0 });
        var y = ctrl.wrapper.scrollTop - y;
        ctrl.fnMove({ pageY: y });
        var hasSmoothEffect = ctrl.smoothEffect;
        ctrl.smoothEffect = false;
        ctrl.fnUp({ pageY: y });
        ctrl.smoothEffect = hasSmoothEffect;
    };

    // allow user to move to a specific space
    ctrl.moveToSpace = function(space) {
        space = between(space, 1, ctrl.numSpaces);
        ctrl.moveToPos(ctrl.points[space - 1]);
    };

    // function that calc maxTop and move scroll to initialSpace
    var setInitialSpace = function() {
        ctrl.initialSpace = between(ctrl.initialSpace, 1, ctrl.numSpaces);
        ctrl.validElements(ctrl.$wrapper.children()).each(function() {
            maxTop += $(this).outerHeight(true);
        });
        ctrl.moveToSpace(ctrl.initialSpace || 1);
    };

    // function that run always on initialization
    var init = function() {
        getPoints();
        setInitialSpace();
    };

    // check form images inside ctrl.$wrapper
    // if waitImages remains false
    // it is because:
    //  - all images are aleady loaded; or
    //  - there is no one image

    var waitImages = false;
    ctrl.$wrapper.find('img').each(function() {
        if (!this.complete) {
            waitImages++;
            this.onload = function() {
                waitImages--;
                if (waitImages === 0) {
                    init();
                }
            };
        }
    });
    waitImages === false && init();

    // Return ctrl instance to the user 
    return ctrl;
};
