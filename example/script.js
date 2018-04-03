$(document).ready(function() {

    var input = $('input');
    var scroll = $('#myScrollWrapper');

    $('.space').each(function() {
        var $space = $(this);
        $space.css({
            color: $space.data('color'),
            backgroundColor: $space.data('bg'),
        });
    });

    var ctrl = {
        scrollbar: '.scrollbar',
        onSpaceChange: function() {
            input.val(ctrl.space);

            var div = $('.space:nth-child(' + ctrl.space + ')');
            ctrl.scrollbar.css({
                borderColor: div.data('color'),
                backgroundColor: div.data('bg'),
            });
            scroll.css('backgroundColor', div.data('bg'));
        },
        spaceLimits: ['.space'],
    };

    scroll.doScroll(ctrl);

    input.attr({
        min: 1,
        max: ctrl.numSpaces,
    }).on('input', function() {
        ctrl.moveToSpace(this.value);
    });
});