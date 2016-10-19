# jquery-do-scroll
Creates an scroll-y like action.

You can create an scroll-y this way:

```JavaScript
$('.wrapper').doScroll();
```

But of course, you can add custom settings:

```JavaScript
var options = {
	onInit: function() {},
	onSpaceChange: function() {},
	spaceLimits: [0, 245, '#animate', '.spaces'],
	scrollbar: '.scrollbar',
	smoothEffect: true,
	initialSpace: 1,
	wheelStep: 150,
};
$('.scroll-container').doScroll(options);
```

All properties are optional.