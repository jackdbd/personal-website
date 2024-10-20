---
date: "2020-09-12T12:00:00.000Z"
description: Polymorphism is a generic concept that means providing many implementations while retaining a single interface. Clojure multimethods allow us to use multiple dynamic dispatch.
tags:
  - Clojure
  - polymorphism
title: Flexible runtime polymorphism with Clojure multimethods
---
Polymorphism is a generic concept that means providing many implementations while retaining a single interface.

There are many kinds of polymorphism in computer science. There is static polymorphism, where the implementation is chosen at compile time, and then there is with dynamic polymorphism, where it is chosen at run time.
This article will only discuss the latter.

The mechanism used by dynamic polymorphism to select the function/method to invoke at run time is called [dynamic dispatch](https://en.wikipedia.org/wiki/Dynamic_dispatch), or simply dispatch.

## Single dispatch

Many languages can dispatch on the *type* of the *first* argument.

Take for example this Python class:

```python
class Animal:

    def sound(self):
        return "foo"
```

We can create a subclass like this one, and *override* the `sound` method:

```python
class Cat(Animal):

    def sound(self):
        return "meow"
```

If we then create an instance of `Cat` and call `sound()` on it, we get `"meow"` as the return value.

```python
cat = Cat()
cat.sound()
"meow"
```

This is *runtime subtype-based polymorphism* in action: the behavior—what the `sound` method is supposed to do—is chosen dynamically based on the runtime type of the object. When we call `cat.sound()`, the `sound` method receives the instance of `Cat` it is bound to. This one argument (i.e. `self`) is used to select which implementation of `sound` to run.
To put it in other terms, there can be many implementations of `sound`, but when we call `cat.sound()` it's the `sound` method in the `Cat` class the one who gets called.

Many other programming languages support this single dispatch mechanism. On the other hand, only a few ones have a multiple dispatch mechanism.

## Multiple dispatch (aka multimethods)

In languages that support a multiple dispatch mechanism, one or more of the arguments passed to a method are used to select the method to run. Clojure and ClojureScript are two of these languages.

In particular, Clojure/ClojureScript multimethods support dispatching on:

- types of any argument passed to the dispatch function;
- values of any argument;
- attributes and metadata;
- relationships between one or more arguments.

When using multimethods in Clojure, we associate **one symbol** with **multiple implementations** (methods) by defining a dispatch function. The dispatch function returns a **dispatch value** that is used to determine which method to use.

### Multimethods: a basic example

Let's see an example. If you want to follow along, I suggest you type the code in a ClojureScript REPL like [Planck](https://github.com/planck-repl/planck).

First of all, we need to define a multimethod with the [defmulti](https://cljs.github.io/api/cljs.core/defmulti) macro.

```clojure
(defmulti draw :shape)
```

Here the symbol `draw` represents the unique interface, and the dispatch function is `:shape` (Clojure/ClojureScript can call keywords because they implement the [same interface as functions](https://clojure.org/reference/data_structures#Keywords)).

We then provide an implementation with the [defmethod](https://cljs.github.io/api/cljs.core/defmethod) macro.

```clojure
(defmethod draw :triangle [options]
  (str "Drawing a " (:color options) " triangle"))
```

And we call the `draw` (multi) function.

```clojure
(draw {:shape :triangle :color "red"})
; "Drawing a red triangle"
```

Here are the steps involved in the few lines of code written above.

1. We call the `draw` multimethod.
2. `draw` is a [MultiFn](https://github.com/clojure/clojure/blob/master/src/jvm/clojure/lang/MultiFn.java), so it can have several implementations. In order to decide which implementation to call, it asks the `:shape` dispatch function to come with a dispatch value that will determine the chosen implementation.
3. The `:shape` dispatch function (remember, keywords behave as functions in Clojure/ClojureScript) extracts the value associated with the `:shape` key from the data structure we passed: `:triangle`. That's the dispatch value.
4. We previously *installed* (it's the term used by `defmethod`) a method associated with the dispatch value `:triangle`, so `draw` calls that method.

What if the dispatch function returns a dispatch value for which we didn't provide an implementation?

```clojure
(draw {:shape :square :color "red"})
; Execution error (Error) at (<cljs repl>:1).
; No method in multimethod 'cljs.user/draw' for dispatch value: :square
```

Here the error message is pretty clear: we didn't provide an implementation for when the dispatch value is `:square`. Let's provide it now.

```clojure
(defmethod draw :square [options]
  (str "Drawing a " (:color options) " square"))
```

Now if we try to call `draw` we get no errors.

```clojure
(draw {:shape :square :color "red"})
; "Drawing a red square"
```

I hope this basic example was helpful in understanding how this dynamic dispatch mechanism works. However, here we are only dispatching on the first argument, so it's just single dispatch, not multiple dispatch.

### Multimethods: a more involved example

Let's see an example of an actual multiple dispatch where we really need the flexibility that Clojure multimethods have to offer.

This time, let's first define the dispatch function by itself. I think it makes the example a bit easier to understand.

The dispatch function is like any other function in Clojure. We can give it any name we want and we can add as many parameters as we want in its signature.

Let's say that we are developing a graphics engine and we want to provide our users with a unique interface to call, the `draw` function. They can call it with a shape (e.g. `"triangle"`), the number of shapes they want to draw (e.g. 10), and some options. We are at the early stages of development, so our graphics engine can't deal with too many shapes (especially if anti-aliasing is on).

Our dispatch function would look like this:

```clojure
(defn engine-dispatch-fn [shape quantity options]
  (cond
    (>= quantity 300) :too-many-shapes
    (and (> quantity 100) (get options :anti-aliasing)) :too-many-shapes-with-anti-aliasing-on
    (> quantity 0) shape
    :else :default))
```

We create a new multimethod with the associated dispatch function.

```clojure
(defmulti draw engine-dispatch-fn)
```

And we install the method responsible for drawing triangles on the screen.

```clojure
(defmethod draw "triangle" [_ quantity options]
  (if (= true (get options :anti-aliasing))
    (str "Drawing " quantity " triangles with anti aliasing")
    (str "Drawing " quantity " triangles")))

(defmethod draw :too-many-shapes [shape quantity _]
  (throw (js/Error. (str "Can't draw " quantity " " shape "s"))))

(defmethod draw :too-many-shapes-with-anti-aliasing-on [shape quantity _]
  (throw (js/Error. (str "Can't draw " quantity " " shape "s when anti-aliasing is on"))))

(defmethod draw :default [shape quantity options]
  (let [msg (if (nil? options)
              (str "Cannot draw " quantity " " shape "s")
              (str "Cannot draw " quantity " " shape "s with options " options))]
    (throw (js/Error. msg))))
```

When our users try to draw some triangles, here is what they would get:

```clojure
(draw "triangle" 101)
; "Drawing 101 triangles"

(draw "triangle" 101 {:anti-aliasing true})
; "Can't draw 101 triangles when anti-aliasing is on"
```

## Conclusion

Multimethods allow us to extend a system without modifying existing code (if we don't have to touch the dispatch function). With their multiple dispatch mechanism, they offer us the highest degree of runtime polymorphism. This article showed only a couple of examples, but if you want to master the subject I recommend Eli Bendersky's series of blog posts [A polyglot's guide to multiple dispatch](https://eli.thegreenplace.net/tag/multiple-dispatch).

The "problem" with multiple dispatch is that we often don't need this flexibility in our code. For most use-case single dispatch is enough. In that case we are better off using another Clojure feature: protocols.
