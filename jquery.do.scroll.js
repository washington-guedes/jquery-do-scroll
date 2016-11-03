$.fn.doScroll = function(obj) {

    // Create an manager extended from options obj
    // return it in instantiation phase
    var ctrl = $.extend({}, obj);
    ctrl.wrapper = this[0];
    ctrl.$wrapper = this.css({
        overflow: 'hidden',
        cursor: '-webkit-grab',
        'user-select': 'none',
        'touch-action': 'pan-y;',
    });

    // block a number from overflowing its own limits
    var between = function(val, min, max) {
        if (val < min) return min;
        if (val > max) return max;
        return val;
    };

    // returns the elapsed time between two dates in /(?:mili)?seconds/
    var elapsedTime = function(from, to, inSeconds) {
        var miliseconds = (to || new Date) - (from || new Date);
        return inSeconds ? miliseconds / 1000 : miliseconds;
    };

    // returns the y axis position from an event
    ctrl.getY = function(e) {
        if (typeof e.pageY !== 'number') {
            e = e.originalEvent;
            e = e.touches[0] || e.changedTouches[0];
        }
        return e.pageY;
    };

    // The below function get all scrollTop positions from spaceLimits:
    //  - when number: consider as scrollTop position
    //  - when string: consider as selector and add each match's scrollTop
    //  - else: discard with warn alert in the console
    // make sure there is a start limit
    // sort the array, so the spaces can be calculated
    // make sure there is an end limit
    // remove duplicated scrollTop positions

    function getPoints() {
        var points = (ctrl.spaceLimits || []).slice();
        for (var i = 0; i < points.length;) {
            switch (typeof points[i]) {
                case 'number':
                    i++;
                    break;
                case 'string':
                    var selector = points.splice(i, 1)[0];
                    ctrl.$wrapper.find(selector).each(function() {
                        var $this = $(this);
                        var $visible = $this.add($this.nextAll(':visible')).hide();
                        points.splice(i++, 0, ctrl.$wrapper.height());
                        $visible.show();
                    });
                    break;
                default:
                    var error = JSON.stringify(points.splice(i, 1)[0]);
                    console.warn('spaceLimits, unexpected: ' + error);
                    break;
            }
        }
        points.unshift(0);
        points.sort(function(x, y) {
            return x - y;
        });
        points.push(Infinity);
        points = points.filter(function(x, i, a) {
            return x !== a[i - 1];
        });
        ctrl.numSpaces = points.length - 1;
        ctrl.points = points;
        // console.log(ctrl.points);
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

    // events to be prevented
    var preventEvents = 'scroll';
    ctrl.prevent = function(e) {
        e.preventDefault();
    };
    ctrl.$wrapper.on(preventEvents, ctrl.prevent);

    // function to get actual space (TODO: test some binary search algorithms)
    ctrl.getSpace = function(y) {
        for (var i = 1; i < ctrl.points.length; i++) {
            if (y < ctrl.points[i]) {
                return i;
            }
        }
        return ctrl.numSpaces;
    };

    // make sure onSpaceChange exists
    if (!ctrl.hasOwnProperty('onSpaceChange')) {
        ctrl.onSpaceChange = function() {};
    }

    // handle down events
    var downEvents = 'mousedown touchstart';
    var startY;
    var lastY;
    var isFingerDown;
    ctrl.fnDown = function(e) {
        isFingerDown = true;
        startY = lastY = ctrl.getY(e);
        startAtTop = ctrl.wrapper.scrollTop;
    };
    ctrl.fnUserDown = function(e) {
        e.fromUser = true;
        ctrl.fnDown(e);
    };

    // handle move events
    var moveEvents = 'mousemove touchmove';
    var height = ctrl.$wrapper.height();
    var offTop = ctrl.$wrapper.offset().top;
    var barMaxTop = height - ctrl.scrollbar.outerHeight(true);
    var maxTop = -height; // the final value is calculated on `init`
    var lastDirection;
    var lastMoveAt;
    var scrolling;
    var lastScrollTop;
    ctrl.fnMove = function(e) {
        if (scrolling || (e.fromUser && !isFingerDown)) {
            return;
        }
        scrolling = true;
        lastMoveAt = new Date;
        window.requestAnimationFrame(function() {
            var thisY = ctrl.getY(e);
            lastStep = thisY - lastY;
            lastY = thisY;

            // true means finger is going down
            var direction = lastStep ? lastStep > 0 : lastDirection;
            if (lastDirection !== direction) {
                lastDirection = direction;
                if (e.fromUser) {
                    ctrl.fnDown({ pageY: thisY });
                    scrolling = false;
                    return;
                }
            }

            // block move if occurred fnDown()
            if (!e.fromUser && isFingerDown) {
                ctrl.endSmooth();
                return;
            }

            // do Scroll
            lastScrollTop = ctrl.wrapper.scrollTop;
            var top = between(startAtTop - thisY + startY, 0, maxTop);
            ctrl.$wrapper.scrollTop(top);
            ctrl.scrollbar.css({
                top: ctrl.wrapper.scrollTop / maxTop * barMaxTop + offTop,
                display: 'block',
            });

            // allow next fnMove to start
            scrolling = false;
            isInEffect && ctrl.smooth(thisY);

            // space verification
            ctrl.space = ctrl.getSpace(ctrl.wrapper.scrollTop);
            if (ctrl.space !== ctrl.lastSpace) {
                ctrl.onSpaceChange(ctrl);
                ctrl.lastSpace = ctrl.space;
            }
        });
    };
    ctrl.fnUserMove = function(e) {
        e.fromUser = true;
        ctrl.fnMove(e);
    };

    // handle what to do on scroll handled end
    ctrl.hasOwnProperty('smoothEffect') || (ctrl.smoothEffect = true);
    var upEvents = 'mouseup touchend';
    var fingerUpAt;
    var lastStep;
    var isInEffect;
    window.ctrl = ctrl;
    ctrl.fnUp = function(e) {
        isFingerDown = false;
        fingerUpAt = new Date;

        // rule whether to do smooth effect on mouseup/touchend
        if (e.fromUser) {
            var lastMoveLag = elapsedTime(lastMoveAt, fingerUpAt);
            if (ctrl.smoothEffect && lastMoveLag < 80) {
                isInEffect = true;
                scrolling || ctrl.smooth(ctrl.getY(e));
            }
        }
    };
    ctrl.fnUserUp = function(e) {
        e.fromUser = true;
        ctrl.fnUp(e);
    };
    ctrl.smooth = function(y) {
        lastStep *= 0.975;
        var unchanged = lastScrollTop === ctrl.wrapper.scrollTop;
        if (unchanged || Math.abs(lastStep) < 2) {
            ctrl.endSmooth();
            return;
        }
        ctrl.fnMove({ pageY: y + lastStep });
    };
    ctrl.endSmooth = function() {
        if (isInEffect) {
            isInEffect = false;
            scrolling = false;
        }
    };

    // treat mouseleave as fnUp is fnDown is on
    ctrl.fnMouseleave = function(e) {
        if (isFingerDown) {
            ctrl.fnUserUp(e);
        }
    };

    // Handle mouse wheel action
    isNaN(ctrl.wheelStep) && (ctrl.wheelStep = 60);
    ctrl.fnMousewheel = function(e) {
        ctrl.endSmooth();
        var direction = e.originalEvent.wheelDelta < 0 ? 1 : -1;
        var diff = direction * ctrl.wheelStep;
        var newY = ctrl.wrapper.scrollTop + diff;
        ctrl.moveToPos(newY);
    };

    // attach events
    var bind = {};
    bind[downEvents] = ctrl.fnUserDown;
    bind[moveEvents] = ctrl.fnUserMove;
    bind[upEvents] = ctrl.fnUserUp;
    bind.mouseleave = ctrl.fnMouseleave;
    bind.mousewheel = ctrl.fnMousewheel;
    var supportPassive = false;
    try {
        var opts = Object.defineProperty({}, 'passive', {
            get: function() { supportPassive = true },
        });
        window.addEventListener('test', null, opts);
    } catch (e) {}
    ctrl.$wrapper.on(bind, supportPassive && { passive: true });

    // allow user to move to a specific scrollTop position
    ctrl.moveToPos = function(y) {
        ctrl.fnDown({ pageY: 0 });
        ctrl.fnMove({ pageY: ctrl.wrapper.scrollTop - y });
        ctrl.fnUp({});
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
        window.requestAnimationFrame(function() {
            var initialPosition = ctrl.$wrapper.css('position');
            ctrl.$wrapper.css({
                position: 'absolute',
                overflow: 'visible',
                height: 'auto',
            });
            maxTop += ctrl.$wrapper.height();
            getPoints();
            ctrl.$wrapper.css({
                position: initialPosition,
                overflow: 'hidden',
                height: height,
            });
            typeof ctrl.onInit === 'function' && ctrl.onInit(ctrl);
            setInitialSpace();
        });
    };

    // wait all image heights to be available
    var childrenImgs = ctrl.$wrapper.find('img');
    var loaded = 0;
    childrenImgs.each(function() {
        var $this = $(this);
        var timer = setInterval(function() {
            if ($this.is('img') && $this.height() == 0) {
                console.log('waiting for: ' + $this[0].src);
                return;
            }
            (++loaded === childrenImgs.length) && init();
            clearInterval(timer);
        }, 50);
    });
    childrenImgs.length || init();

    // Return ctrl instance to the user 
    return ctrl;
};
