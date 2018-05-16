# jquery-do-scroll
Creates an scroll-Y like action.

- [Properties](#properties)
 - [scrollbar](#scrollbar)
 - [wheelStep](#wheelstep)
 - [spaceLimits](#spacelimits-and-onspacechange)
 - [onSpaceChange](#spacelimits-and-onspacechange)
 - [initialSpace](#initialspace)
 - [smoothEffect](#smootheffect)
 - [onTryingToMove](#ontryingtomove)
 - [hideWarnings](#hidewarnings)
 
- [Methods](#methods)
 - [moveToPos](#movetopos)
 - [moveToSpace](#movetospace)

- [Events](#events)
 - [onScroll](#onscroll)

This plugin is intended to create an scroll-Y event (JavaScript controlled) to work in any device.

This is done using touch and mouse event handlers.

---

# Properties

All properties are optional, it allows you to create an scroll with:

```JavaScript
$('#wrapper').doScroll();
```

But of course, you can make an awesome scroll. Let's set some properties:

```JavaScript
var ctrl = {
    // ...
};
```

### scrollbar

Style your own scrollbar:

```JavaScript
var ctrl = {
    // ...
    scrollbar: $('<div />').css({
        backgroundColor: '#fff',
        height: '75px',
        width: '10px',
        border: '2px solid #ccc',
        borderRadius: '5px',
        // ...
    }),
    // ...
};
```

You can also give your scrollbar selector, so the plugin can find it:

```JavaScript
var ctrl = {
    // ...
    scrollbar: '#myScrollBar',
    // ...
};
```

You can also use the default scrollbar by passing `true`:

```JavaScript
var ctrl = {
    // ...
    scrollbar: true,
    // ...
};
```

### wheelStep

The default distance when you use your mouse wheel to scroll is 60 pixels, but you can change it:

```JavaScript
var ctrl = {
    // ...
    wheelStep: 150,
    // ...
};
```

If you'd like to invert the scroll direction on mouse wheel, you can set a negative value.

### spaceLimits, and onSpaceChange

You can trigger some code when you scroll from one space to another. To do this, you should set the `spaceLimits` property.

You can use numbers (in pixels), selectors (as strings), or mix them.

```JavaScript
var ctrl = {
    // ...
    spaceLimits: [100, 200.5, '.space'],
    // ...
};
```

If string, it will find every match of the selector and get its scrollTop position.

After processing the `spaceLimits`, the final array will be like:

```JavaScript
    console.log(ctrl.points); // [0, 400, 1500, Infinity]
```

Which means there are three spaces:

- space 1: `scrollTop >= 0` and `scrollTop < 400`;
- space 2: `scrollTop >= 400` and `scrollTop < 1500`;
- space 3: `scrollTop >= 1500`.

When another space is reached, the `onSpaceChange` function will be executed, if it exists: 

```JavaScript
var ctrl = {
    // ...
    onSpaceChange: function(ctrl) {
        console.log('From %s to %s', ctrl.lastSpace, ctrl.space);
    },
    // ...
};
```

### initialSpace

If your scroll has an `id`, it will be created one key in `localStorage` for it. This way, next time you open your page the scroll will show up in the right position.

Of course, you can disable this functionality with the `initialSpace` property:

```JavaScript
var ctrl = {
    // ...
    initialSpace: 1,
    // ...
};
```

If the `initialSpace` is set, the scroll will show up in the exact position where the given space starts.

### smoothEffect

The inertia effect of the scroll is set by default, but you can also turn off this way:

```JavaScript
var ctrl = {
    // ...
    smoothEffect: false,
    // ...
};
```

### onTryingToMove

With this method set, the scroll action will only occur if you return a truly value. In other words, it allows you to control the behavior of the scroll while returning falsey values.

```JavaScript
var ctrl = {
    // ...
    onTryingToMove: function(y, step) {
        // the plugin is trying to move from scrollTop position y, step amount of pixels.
        // return a truly value to allow, or a falsey one to disallow.
        return true;
    },
    // ...
};
```

### hideWarnings

If you set `hideWarnings`, then it won't log to the console errors like trying to initialize multiple times the same element:

```JavaScript
var ctrl = {
    // ...
    hideWarnings: true,
    // ...
};
```

---

# Methods

### moveToPos

To move to an specific position (in pixels), you can run:

```JavaScript
var position = 250;

ctrl.moveToPos(position);
```

### moveToSpace

To move to an specific space (based on `spaceLimits`), you can use:

```JavaScript
var space = 3;

ctrl.moveToSpace(space);
```

---

# Events

To trigger some function after every scroll pixel change:

### onScroll

```JavaScript

ctrl.onScroll = function(o) {
    console.log(o.y);
};

```

---

# Happy coding

That's it !! Thanks for your interest :)

Guedes, Washington.
