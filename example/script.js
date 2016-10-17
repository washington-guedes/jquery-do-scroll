$(document).ready(function() {

    $('.space').each(function() {
        var $space = $(this);
        $space.css({
            'color': $space.data('color'),
            'background-color': $space.data('bg'),
        });
    });

    var $input = $('input');

    var fnOnInit = function(ctrl) {
        $input.attr({
            min: 1,
            max: ctrl.numSpaces,
        });
        $input.on('input', function() {
            ctrl.moveToSpace(this.value);
        });
    };

    var fnAction = function(ctrl) {
        $input.val(ctrl.space);
        var $space = $('.space:nth-child(' + ctrl.space + ')');
        ctrl.scrollbar.css({
            'border-color': $space.data('color'),
            'background-color': $space.data('bg'),
        });
        ctrl.$wrapper.css('background-color', $space.data('bg'));
    };

    var instance = $('.wrapper').handleScroll({
        scrollbar: '.scrollbar',
        arrayFnSpaces: [fnAction, '.space'],
        wheelStep: 150,
        onInit: fnOnInit,
    });

});
