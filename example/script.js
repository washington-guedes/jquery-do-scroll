$(document).ready(function() {

    $('.space').each(function() {
        var $space = $(this);
        $space.css({
            'color': $space.data('color'),
            'background-color': $space.data('bg'),
        });
    });

    var ctrl = $('.wrapper').handleScroll({
        scrollbar: '.scrollbar',
        arrayFnSpaces: [fnAction, '.space'],
        initialSpace: 1,
        smoothEffect: true,
    });

    var $input = $('input');
    $input.on('input', function() {
        ctrl.moveToSpace(this.value);
    });

    $input.attr({
        min: 1,
        max: ctrl.numSpaces,
    });

    function fnAction() {
        $input.val(this.space);
        var $space = $('.space:nth-child(' + this.space + ')');
        this.scrollbar.css({
            'border-color': $space.data('color'),
            'background-color': $space.data('bg'),
        });
        this.$wrapper.css('background-color', $space.data('bg'));
    };

});
