$.fn.handleScroll = function(obj) {

    // Create an manager extended from options obj
    // return it in instantiation phase

    var ctrl = $.extend({}, obj);
    ctrl.wrapper = this[0];
    ctrl.$wrapper = this.css({
        overflow: 'hidden',
        cursor: '-webkit-grab',
    });

    // block a number from overflowing its own limits
    var between = function(val, min, max) {
        if (val < min) return min;
        if (val > max) return max;
        return val;
    };

    // returns the elapsed time between two dates in /(?:mili)?seconds/
    var elapsedTime = function(from, to, inSeconds) {
        var milliseconds = (to || new Date) - (from || new Date);
        return inSeconds ? milliseconds / 1000 : milliseconds;
    };

    // returns the y axis position from an event
    ctrl.getY = function(e) {
        if (typeof e.pageY !== 'number') {
            e = e.originalEvent;
            // if (!e) return -1;
            e = e.touches[0] || e.changedTouches[0];
        }
        return e.pageY;
    };

    // function to allow only visible elements which has calculable height
    ctrl.validElements = function($elements) {
        return $elements.filter(function() {
            var $this = $(this);
            if ($this.is(':hidden')) {
                $this.show();
            }
            if (['relative', 'static'].indexOf($this.css('position')) === -1) {
                return false;
            }
            return true;
        });
    };

    // The below function get all scrollTop positions from arrayFnSpaces:
    //  - first item: must be a function, the fnUserAction
    //  - when number: consider as scrollTop position
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
            if (y <= ctrl.points[i]) {
                return i + (i !== ctrl.numSpaces);
            }
        }
        return ctrl.points.length;
    };

    // handle what to do before handling scroll
    var downEvents = 'mousedown touchstart';
    var touchStarted;
    var startAtTop;
    var startY;
    var lastY;
    ctrl.fnDown = function(e) {
        prevent(e);
        ctrl.userStopped = false;
        startY = lastY = ctrl.getY(e);
        startAtTop = ctrl.wrapper.scrollTop;
        touchStarted = new Date;
        ctrl.$wrapper.on(moveEvents, ctrl.fnUserMove);
    };

    // handle scroll
    var moveEvents = 'mousemove touchmove';
    var height = ctrl.$wrapper.outerHeight(true);
    var offTop = ctrl.$wrapper.offset().top;
    var barMaxTop = height - ctrl.scrollbar.outerHeight(true);
    var maxTop = -height; // the final value is calculated on `init`
    var lastDirection;
    var lastStep; // used on smooth effect
    ctrl.fnMove = function(e) {
        if (ctrl.running) {
            return;
        }
        ctrl.running = new Date;
        window.requestAnimationFrame(function() {
            var thisY = ctrl.getY(e);
            lastStep = thisY - lastY;
            lastY = thisY;
            var thisDirection = lastStep ? lastStep > 0 : lastDirection;
            var directionChanged = thisDirection !== lastDirection;
            lastDirection = thisDirection;
            if (e.block || (e.userMove && directionChanged)) {
                ctrl.fnUp({ blockSmooth: true });
                ctrl.fnDown({ pageY: thisY });
                ctrl.running = false;
                return;
            }
            var top = between(startAtTop - thisY + startY, 0, maxTop);
            if (e.fromSmooth) {
                ctrl.userStopped = elapsedTime(touchStarted, effectStarted) < 0;
                if (ctrl.userStopped) {
                    delete ctrl.afterMove;
                    ctrl.running = false;
                    return;
                }
            }
            ctrl.$wrapper.scrollTop(top);
            ctrl.scrollbar.css({
                top: ctrl.wrapper.scrollTop / maxTop * barMaxTop + offTop,
                display: 'block',
            });
            ctrl.space = ctrl.getSpace(ctrl.wrapper.scrollTop);
            ctrl.running = false;
            typeof ctrl.afterMove === 'function' && ctrl.afterMove(thisY);
            if (ctrl.space !== ctrl.lastSpace) {
                ctrl.userAction(ctrl);
                ctrl.lastSpace = ctrl.space;
            }
        });
    };
    ctrl.fnUserMove = function(e) {
        e.userMove = true;
        ctrl.fnMove(e);
    };

    // handle what to do on scroll handled end
    var upEvents = 'mouseup touchend mouseleave';
    ctrl.fnUp = function(e) {
        ctrl.$wrapper.off(moveEvents, ctrl.fnUserMove);
        if (ctrl.smoothEffect && !e.blockSmooth && elapsedTime(ctrl.running) < 50) {
            fnSmoothEffect(ctrl.getY(e));
        }
    };

    // Trying to simulate ipad behavior after touchmove/scroll
    ctrl.hasOwnProperty('smoothEffect') || (ctrl.smoothEffect = true);
    var effectStarted;
    var fnSmoothEffect = function(y) {
        effectStarted = new Date;
        ctrl.afterMove = function(y) {
            if (Math.abs(lastStep) < 2) {
                delete ctrl.afterMove;
            } else {
                lastStep *= 0.97;
                ctrl.fnMove({ pageY: y + lastStep, fromSmooth: true });
            }
        };
        ctrl.fnMove({
            pageY: y + lastStep,
            fromSmooth: true,
            block: ctrl.userStopped,
        });
    };

    // Handle mouse wheel action
    isNaN(ctrl.wheelStep) && (ctrl.wheelStep = 60);
    ctrl.fnMousewheel = function(e) {
        var direction = e.originalEvent.wheelDelta < 0 ? 1 : -1;
        var diff = direction * ctrl.wheelStep;
        var newY = ctrl.wrapper.scrollTop + diff;
        ctrl.moveToPos(newY);
    };

    // attach events
    var bind = {};
    bind[downEvents] = ctrl.fnDown;
    bind[upEvents] = ctrl.fnUp;
    bind[preventEvents] = prevent;
    bind.mousewheel = ctrl.fnMousewheel;
    ctrl.$wrapper.on(bind);

    // allow user to move to a specific scrollTop position
    ctrl.moveToPos = function(y) {
        ctrl.fnDown({ pageY: 0 });
        ctrl.afterMove = function(y) {
            ctrl.fnUp({ blockSmooth: true });
            delete ctrl.afterMove;
        };
        ctrl.fnMove({ pageY: ctrl.wrapper.scrollTop - y });
    };

    // allow user to move to a specific space
    ctrl.moveToSpace = function(space) {
        space = between(space, 1, ctrl.numSpaces);
        ctrl.moveToPos(ctrl.points[space - 1]);
    };

    // function that moves scroll to initialSpace onInit
    var setInitialSpace = function() {
        ctrl.initialSpace = between(ctrl.initialSpace, 1, ctrl.numSpaces) || 1;
        ctrl.moveToSpace(ctrl.initialSpace);
    };

    // function that initializes the plugin
    var init = function() {
        getPoints();
        typeof ctrl.onInit === 'function' && ctrl.onInit(ctrl);
        setInitialSpace();
    };

    // wait all children heights to be available and set `maxTop`
    var children = ctrl.validElements(ctrl.$wrapper.children());
    var loaded = 0;
    children.each(function() {
        var $this = $(this);
        var timer = setInterval(function() {
            if ($this.is('img') && $this.height() == 0) {
                return;
            }
            maxTop += $this.outerHeight(true);
            (++loaded === children.length) && init();
            clearInterval(timer);
        }, 50);
    });

    // Return ctrl instance to the user 
    return ctrl;
};
