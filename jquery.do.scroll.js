$.fn.doScroll = function(ctrl) {
    'use strict';

    var self, _self, downY, isDown, isMoving, lastY, step, allowSmooth, sbar, _sbar, downHandler, item, newSpace;

    self = this;
    if (self.is('.--doscroll-on')) {
        if (!ctrl.hideWarnings) {
            console.warn('do scroll already set');
        }
        return;
    }

    _self = this[0];

    ctrl.doScrollKey = 'doScrollKey$' + location.href + '$' + (ctrl.id || _self.id);

    self.css({
        overflow: 'hidden',
        userSelect: 'none',
        cursor: '-webkit-grab',
        touchAction: 'pan-y',
    });

    if (ctrl.scrollbar === true) {
        ctrl.scrollbar = $('<div class="scrollbar"></div>').css({
            border: '1px solid #aaa',
            width: 20,
            height: 160,
        });
    } else {
        ctrl.scrollbar = $(ctrl.scrollbar);
    }

    sbar = ctrl.scrollbar;
    self.after(sbar);
    _sbar = sbar[0];

    sbar.css({
        position: 'absolute',
        userSelect: 'none',
        left: (_self.offsetLeft + _self.offsetWidth) || (parseFloat(self.css('marginLeft')) + self.width()),
        top: (_self.offsetTop || parseFloat(self.css('marginTop'))),
    });

    if (!self.is(':visible')) {
        sbar.hide();
    }

    downEvent(self);
    downEvent(sbar);

    if (typeof ctrl.onScroll !== 'function') {
        ctrl.onScroll = function(){};
    }

    if (typeof ctrl.onTryingToMove !== 'function') {
        ctrl.onTryingToMove = function() {
            return true;
        };
    }

    $(window).on('mousemove touchmove', function(e) {
        if (!isDown) return;

        if (isMoving) return;
        isMoving = true;

        window.requestAnimationFrame(function() {
            var thisY, newTop, minTop, maxTop;

            thisY = getY(e);
            step = lastY - thisY;
            lastY = thisY;

            if (ctrl.onTryingToMove(_self.scrollTop, step)) {
                
                if (downHandler === self) {
                    self.scrollTop(_self.scrollTop + step);
                    set_sbar_using_self();
                } else { // downHandler === sbar
                    minTop = _self.offsetTop;
                    maxTop = minTop + getHeightAreaScrollBar();
    
                    step = -step;
                    newTop = _sbar.offsetTop - parseFloat(sbar.css('marginTop')) + step;
                    if (newTop < minTop) newTop = minTop;
                    else if (newTop > maxTop) newTop = maxTop;
    
                    sbar.css('top', newTop);
                    set_self_using_sbar();
                }
    
                positionChanged();
            }

            isMoving = false;
        });
    });

    $(window).on('mouseup touchend', function(e) {
        if (!isDown) return;

        isDown = false;

        if (ctrl.smoothEffect !== false) {
            allowSmooth = true;
            Smooth();
        }
    });

    self.add(sbar).on('scroll', function(e) {
        e.preventDefault();
    });

    if (!ctrl.hasOwnProperty('wheelStep')) {
        ctrl.wheelStep = 60;
    }
    self.on('mousewheel', function(e) {
        var direction;

        direction = e.originalEvent.wheelDelta < 0 ? 1 : -1;
        ctrl.moveToPos(_self.scrollTop + (ctrl.wheelStep * direction));
    });

    (function findPoints() {
        ctrl.points = [];

        if (ctrl.spaceLimits) {
            for (var i = 0; i < ctrl.spaceLimits.length; i++) {
                item = ctrl.spaceLimits[i];

                if (typeof item === 'string') {
                    var scrollHeight, nextAllVisible;

                    scrollHeight = self.height();
                    self.css('height', 'auto');

                    self.find(item).each(function() {
                        nextAllVisible = $(this).nextAll(':visible').add(this).hide();
                        ctrl.points.push(_self.scrollHeight);
                        nextAllVisible.show();
                    });
                    self.height(scrollHeight);

                } else if (typeof item === 'number') {
                    ctrl.points.push(item);
                } else {
                    console.warn(item, 'is not a valid point to scroll.');
                }
            }
        }

        ctrl.points.sort(function(a, b) { return a - b; });
        ctrl.points.unshift(0);
        ctrl.points.push(Infinity);
        ctrl.points = ctrl.points.filter(function(x, i, a) { return a[i - 1] !== x; });
    })();

    ctrl.moveToPos = moveToPos;
    ctrl.moveToSpace = moveToSpace;
    ctrl.lastSpace = 1;

    if (ctrl.hasOwnProperty('initialSpace')) {
        ctrl.moveToSpace(ctrl.initialSpace);
    } else if (localStorage[ctrl.doScrollKey]) {
        ctrl.moveToPos(localStorage[ctrl.doScrollKey]);
    }

    self.addClass('--doscroll-on');

    return self;

    function getY(e) {
        if (typeof e.pageY !== 'number') {
            e = e.originalEvent;
            e = e.touches[0] || e.changedTouches[0];
        }
        return e.pageY;
    };

    function Smooth() {
        var smoothStep;

        if (!allowSmooth) {
            return;
        }

        step *= 0.975;
        if (Math.abs(step) < 2) {
            return;
        }

        smoothStep = _self.scrollTop;
        if (ctrl.onTryingToMove(_self.scrollTop, step)) {
            self.scrollTop(_self.scrollTop + step);
            
            set_sbar_using_self();
            positionChanged();
        }
        else return;

        smoothStep -= _self.scrollTop;
        if (Math.abs(smoothStep) < 2) {
            return;
        }

        setTimeout(Smooth, 10);
    };

    function getHeightAreaScrollBar() {
        var areaScrollBarHeight;

        areaScrollBarHeight = _self.offsetHeight - _sbar.offsetHeight;
        areaScrollBarHeight -= parseFloat(sbar.css('marginTop')) + parseFloat(sbar.css('marginBottom'));

        return areaScrollBarHeight;
    };

    function set_sbar_using_self() {
        var ratio;

        if (!_sbar) return;

        ratio = Math.min(_self.scrollTop / (_self.scrollHeight - _self.offsetHeight), 1);
        sbar.css('top', _self.offsetTop + ratio * getHeightAreaScrollBar());
    };

    function set_self_using_sbar() {
        var ratio;

        ratio = Math.min((_sbar.offsetTop - _self.offsetTop - parseFloat(sbar.css('marginTop'))) / getHeightAreaScrollBar(), 1);
        self.scrollTop(ratio * (_self.scrollHeight - _self.offsetHeight));
    };

    function downEvent(handler) {
        handler.on('mousedown touchstart', function(e) {
            downY = lastY = getY(e);
            isDown = true;
            downHandler = handler;
            allowSmooth = false;

            sbar.css({
                left: _self.offsetLeft + _self.offsetWidth,
            });
        });
    };

    function moveToPos(y) {
        var maxPos, step;

        maxPos = _self.offsetTop + (_self.scrollHeight - _self.offsetHeight);
        if (y > maxPos) y = maxPos;
        if (y < 0) y = 0;

        step = y - _self.scrollTop;
        
        if (ctrl.onTryingToMove(_self.scrollTop, step)) {
            self.scrollTop(y);
            set_sbar_using_self();
    
            positionChanged();
        }
    };

    function moveToSpace(x) {
        if (x < 1) x = 1;
        if (x > ctrl.points.length) x = ctrl.points.length;

        newSpace = x;
        moveToPos(ctrl.points[x - 1]);
    };

    function positionChanged() {
        var pos, space;

        pos = _self.scrollTop;
        localStorage[ctrl.doScrollKey] = pos;

        if (newSpace) {
            space = newSpace;
            newSpace = null;
        } else {
            space = findSpace(pos);
        }

        if (space != ctrl.space) {
            ctrl.lastSpace = ctrl.space;
            ctrl.space = space;

            if (typeof ctrl.onSpaceChange === 'function') {
                ctrl.onSpaceChange(ctrl);
            }
        }

        ctrl.onScroll({ y: pos });
    };

    function findSpace(pos) {
        var left, right, mid;

        left = 1;
        right = ctrl.points.length;

        while (left < right) {
            mid = (left + right) >> 1;

            if (pos < ctrl.points[mid]) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return right;
    };

};