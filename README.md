# jquery-do-scroll
Creates an scroll-y like action.

- [Properties](#properties)
 - [scrollbar](#scrollbar)
 - [wheelStep](#wheelstep)
 - [spaceLimits](#spacelimits-and-onspacechange)
 - [onSpaceChange](#spacelimits-and-onspacechange)
 - [initialSpace](#initialspace)
 - [smoothEffect](#smootheffect)
 - [onInit](#oninit)
 
- [Methods](#methods)
 - [moveToPos](#movetopos)
 - [moveToSpace](#movetospace)

This plugin is intended to create an scroll (JavaScript controlled) to work in any device.

This is done using touch and mouse event handlers.

---

# Properties

All properties are optional, it allows you to create an scroll with:

```JavaScript
$('#wrapper').doScroll();
```

But of course, you can add some properties to make your scroll awesome. Let's populate an object:

```JavaScript
var properties = {};
```

### scrollbar

You are free to style your own scrollbar:

```JavaScript
properties.scrollbar = $('<div />').css({
    backgroundColor: '#fff',
    height: '75px',
    width: '10px',
    border: '2px solid #ccc',
    borderRadius: '5px',
});
```

Or you can supply a selector to be your scrollbar:

```JavaScript
properties.scrollbar = '#myScrollBar';
```

### wheelStep

The default distance when you use your mouse wheel to scroll is 60 pixels, but you can change it:

```JavaScript
properties.wheelStep = 150;
```

If you'd like to invert the scroll direction on mouse wheel, you can set a negative value.

### spaceLimits, and onSpaceChange

There is a ready built-in that allows you to run specific code when certain points are reached when scrolling.

It works by declaring both: `spaceLimits` array, and `onSpaceChange` function:

```JavaScript
properties.spaceLimits = ['.space'];
properties.onSpaceChange = function(ctrl) {
    console.log('From %s to %s', ctrl.lastSpace, ctrl.space);
};
```

Let's suppose you have three inline-block elements with class `space` inside your wrapper element with height 200px each. This will be the result:

```JavaScript
ctrl.points = [0, 200, 400, Infinity];
```

In pixels:

- space 1: `scrollTop >= 0` and `scrollTop < 200`;
- space 2: `scrollTop >= 200` and `scrollTop < 400`;
- space 3: `scrollTop >= 400`.

This is how `doScroll` function detects when to trigger the `onSpaceChange` function.

You can also set positions instead of selectors in the `spaceLimits` property: 

```JavaScript
properties.spaceLimits = [200, 400];
```

- `0` and `Inifinity` values will always be added to `spaceLimits`;
- Any duplicated values will be removed.
- Any other data type will trigger `console.alert`.

### initialSpace

The default initital space is `1`. But you can change it:

```JavaScript
properties.initialSpace = 3;
```

The `initialSpace` must be a valid space, otherwise will be automatically changed to 1 or to the lastSpace.

### smoothEffect

The inertia effect of the scroll is by default on, but you can turn off this way:

```JavaScript
properties.smoothEffect = false;
```

### onInit

The `doScroll` function waits the child images to be ready before start working completely. You can avail this action to do something you'd like to: 

```JavaScript
properties.onInit = function(ctrl) {
    // ready to scroll
};
```

---

# Methods

The `doScroll` function returns an instance of the manager control to you:

```JavaScript
var ctrl = $('#wrapper').doScroll(properties);
```

### moveToPos

To move to an specific position (in pixels), you can use:

```JavaScript
ctrl.moveToPos(250);
```

### moveToSpace

To move to an specific space (based on `spaceLimits`), you can use:

```JavaScript
ctrl.moveToSpace(3);
```

---

# Happy coding

That's it !! Thanks for your interest :)

Guedes, Washington.
