Number.prototype.between = function(min, max) {
    if (this < min) return min;
    if (this > max) return max;
    return +this;
};

$.fn.scroll = function(obj) {
    obj = obj || {};
    var that = this[0];
    var $that = this.css('overflow', 'hidden');
    var width = $that.width();
    var height = $that.height();
    var offset = $that.offset();
    var offTop = offset.top;
    var maxTop = -height;
    $that.children('img').each(function() {
        $(this).on('load', function() {
            $(this).css({
                position: 'relative',
                float: 'left',
            });
            maxTop += $(this).height();
        });
    });
    var thisBar = $(obj.bar);
    if (thisBar.length) {
        thisBar.detach().appendTo('body');
        thisBar.css({
            position: 'absolute',
            left: offset.left + width,
        });
    }
    var elastic = obj.elastic;
    var getSpace = false;
    var barMaxTop = height - thisBar.height();
    var startAtTop;
    var startY = 0;
    var distance;
    var touchStarted;
    var lastRun;
    var elapsedTime = function(from, to, inSeconds) {
        var milliseconds = (+(to || new Date)) - (+from);
        return inSeconds ? milliseconds / 1000 : milliseconds;
    };
    var lastSpace = 1;
    var currentSpace = 1;
    var getY = function(e) {
        if (isNaN(e.pageY)) {
            e = e.originalEvent;
            e = e.touches[0] || e.changedTouches[0];
        }
        return e.pageY;
    };
    var prevent = function(e) {
        if (typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        if (typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
    };
    var fnDown = function(e) {
        prevent(e);
        startY = getY(e);
        startAtTop = that.scrollTop;
        touchStarted = new Date;
        $that.on(moveEvent, fnMove);
    };
    var points = obj.arrayFnSpaces || [function() {}];
    var fnSpaceChanged = points[0];
    points[0] = 0;
    points.push(Infinity);
    var totalPoints = points.length;
    var getSpace = function(y) {
        for (var i = 0; i < totalPoints; i++) {
            if (y < points[i]) {
                return i;
            }
        }
        return totalPoints;
    };
    var moveEvent = 'mousemove touchmove';
    var running = false;
    var fnMove = function(e) {
        if (running) {
            return;
        }
        running = true;
        window.requestAnimationFrame(function() {
            lastRun = new Date;
            distance = startY - getY(e);
            $that.scrollTop((startAtTop + distance).between(0, maxTop));
            thisBar.css('top', that.scrollTop / maxTop * barMaxTop + offTop);
            currentSpace = getSpace(that.scrollTop);
            if (currentSpace !== lastSpace) {
                fnSpaceChanged(currentSpace, lastSpace);
                lastSpace = currentSpace;
            }
            running = false;
        });
    };
    var fnUp = function(e) {
        $that.off(moveEvent, fnMove);
        if (elastic && elapsedTime(lastRun) < 200) {
            var totalTime = elapsedTime(touchStarted, 1);
            newTime = totalTime.between(2, totalTime);
            elasticEffect(getY(e), distance / newTime, 20);
        }
    };
    var elasticEffect = function(y, slip, delay) {
        var elasticStarted = new Date;
        var counter = Math.sqrt(Math.abs(slip) | 0) | 0;
        var slipX = slip / counter;
        (function effect(counter, i) {
            var scrollEnded = elapsedTime(touchStarted, elasticStarted) < 0;
            if (!counter || scrollEnded) {
                return;
            }
            setTimeout(function() {
                fnMove({ pageY: y - slipX * i });
                effect(counter - 1, i + 1);
            }, delay);
        })(counter, 1);
    };
    $that.on('mousedown touchstart', fnDown)
        .on('mouseup touchend', fnUp)
        .on('scroll mousewheel', prevent);
    fnMove({ pageY: 0 });
    thisBar.show();
    return {
        moveToSpace: function(space) {
            fnDown({ pageY: 0 });
            var y = that.scrollTop - points[space - 1];
            fnMove({ pageY: y });
            var isElastic = elastic;
            elastic = false;
            fnUp({ pageY: y });
            elastic = isElastic;
        },
    };
};
