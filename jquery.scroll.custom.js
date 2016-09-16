Number.prototype.between = function(min, max) {
    if (this < min) return min;
    if (this > max) return max;
    return +this;
};

$.fn.scroll = function(obj) {
    obj = obj || {};
    var that = this[0];
    var $that = this;
    var width = $that.width();
    var height = $that.height();
    var offset = $that.offset();
    var maxTop = -height;
    $that.children('img').each(function() {
        maxTop += $(this).height();
    });
    var barHeight;
    if (obj.bar) {
        obj.bar = $(obj.bar).detach().appendTo('body');
        barHeight = obj.bar.height();
        obj.bar.css({
            position: 'absolute',
            left: offset.left + width,
        }).show();
    }
    var elastic = obj.elastic;
    var getSpace = false;
    var fnSpaceChanged;
    var points = obj.arrayFnSpaces;
    var barMaxTop = height - barHeight;
    var startAtTop;
    var startY = 0;
    var distance;
    var lastMove;
    var lastSpace = 1;
    var currentSpace = 1;
    var fnDown = function(e) {
        if (typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        startY = e.pageY;
        startAtTop = that.scrollTop;
        $that.on(moveEvent, fnMove);
    }
    var moveEvent = 'mousemove touchmove';
    var fnMove = function(e) {
        lastMove = new Date;
        distance = startY - e.pageY;
        $that.scrollTop((startAtTop + distance).between(0, maxTop));
        if (barHeight) {
            obj.bar.css({
                top: that.scrollTop / maxTop * barMaxTop + offset.top,
            });
        }
        if (getSpace !== false) {
            currentSpace = getSpace(that.scrollTop);
            if (currentSpace !== lastSpace) {
                fnSpaceChanged(currentSpace);
                lastSpace = currentSpace;
            }
        }
    };
    fnMove({ pageY: 0 });
    var fnUp = function(e) {
        var delay = distance / 3.5 | 0;
        var delayTime = 20;
        $that.off(moveEvent, fnMove);
        if (!elastic || +new Date - (+lastMove) > 200) return;
        (function setDelay(counter, i) {
            if (counter) {
                setTimeout(function() {
                    var newY = e.pageY - delay * i;
                    fnMove({ pageY: newY });
                    setDelay(counter - 1, i + 1);
                }, delayTime);
            }
        })(Math.sqrt(Math.abs(delay)) | 0, 1);
    };
    if (typeof points === 'object' && points.map === [].map) {
        var fnSpaceChanged = points[0];
        if (points.length && typeof fnSpaceChanged === 'function') {
            points[0] = 0;
            points.push(Infinity);
            getSpace = function(y) {
                var l = points.length;
                for (var i = 0; i < l; i++) {
                    if (y < points[i]) {
                        return i;
                    }
                }
                return l;
            };
        }
    }
    $that.on('mousedown touchstart', fnDown).on('mouseup touchend', fnUp);
    return {
        moveToSpace: function(space) {
            fnDown({ pageY: 0 })
            var y = that.scrollTop - points[space - 1];
            fnMove({ pageY: y });
            isElastic = elastic;
            elastic = false;
            fnUp({ pageY: y });
            elastic = isElastic;
        },
    };
};
