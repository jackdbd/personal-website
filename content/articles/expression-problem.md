---
date: "2020-09-10T12:00:00.000Z"
description: The expression problem is about adding new capabilities to existing code without modifying it. In this article we discuss a few approaches to solve the expression problem.
ogp:
  # 320x180 image from Youtube video, generated here: https://y-image.net/
  image: https://i.ytimg.com/vi/lC39ifspIf4/mqdefault.jpg
  imageAlt: Michael Fogus presenting the talk ClojureScript Anatomy at the InfoQ conference in 2012
  video: https://youtu.be/lC39ifspIf4
tags:
  - Clojure
  - Julia
  - polymorphism
title: 3 ways to solve the expression problem
---
The expression problem—also known as the extensibility problem—is about adding new capabilities to existing code without modifying it.

The term was coined by Philip Wadler at Bell Labs in the late 90s. As he put it:

> The goal is to define a datatype by cases, where one can add new cases to the datatype and new functions over the datatype, without recompiling existing code, and while retaining static type safety (e.g., no casts).

Given that we might use a dynamic language instead of a language that require a compilation step to introduce new functionality, I suggest we view the *existing code* Wadler talks about, as code that comes from a library we don't have access to and we can't modify directly. Let's image we can't read the source code of the original library and we can only use its public API.

To recap, here is what we want to achieve:

1. use the **existing types** provided by a third-party library, and **introduce new operations** on such types;
2. use the **existing operations** provided by the library, and **introduce new types** that can be acted upon by such operations.

Cool. How do we go about solving goals 1 and 2?

## Different approaches to solve the expression problem

In **object-oriented languages goal 1 is hard, goal 2 is easy**: introducing new operations on existing types is hard, because we would need to modify all existing types to support the new operations (and we might not be able to do it, if we don't control the code which defines such types); on the other hand, introducing new types is easy, because we can just subclass the existing types.

In **functional languages goal 1 is easy, goal 2 is hard**: introducing new operations on existing types is easy, because we can just create a new function; but introducing new types is hard, because we would need to edit every function that accepts the new types we want to support.

So, neither with object-oriented languages nor with functional languages we can achieve goal 1 and 2 easily, and we need to rely on additional language features or design patterns to do that.

Here are three approaches we can take to solve the expression problem:

- open classes (aka monkey patching)
- multiple dynamic dispatch (aka multimethods)
- single dynamic dispatch

Not all languages support all of these features. Let's see a few examples.

## Open classes (aka monkey patching)

Dynamic languages such as Ruby, Python and Javascript can redefine at runtime any code they need to extend.

Let's say there is a class that we want to extend. Here is what we have to do:

1. import the class we want to extend;
2. define new methods or redefine existing ones;
3. attach them to the class we want to extend.

Step 1: import the class we want to extend.

```python
class MyClass:
    a = 1
    b = '2'

    def get_value(self):
        return self.a
```

Step 2: define a new method.

```python
def get_another_value(cls):
    return cls.b
```

Step 3: attach the new method to the existing class.

```python
MyClass.get_another_value = get_another_value
```

With these 3 steps we achieved goal 1: introduce new operations on existing types.

What about goal 2, namely introduce new types that can be acted upon by existing operations?

This is a non-issue in dynamic languages like Python and Javascript. Since in these languages functions are first-class citizens, we can pass them around and bind them to our objects at runtime. And thanks to duck typing we can use existing functions with our new objects.

In Python we can even allow our classes to define their own behavior with respect to language operators. This can be done with [special method names](https://docs.python.org/3/reference/datamodel.html#special-method-names), commonly known as magic methods.

So if we have an existing class like this:

```python
class FooParent:

    def bar(self):
        return "baz"
```

and we want to introduce new functionality when instances of this class are garbage collected, we can extend `FooParent` and overload `__del__`:

```python
class FooChild(FooParent):

    def __del__(self):
        print("I am garbage collected!")
```

So when we write:

```python
foo = FooChild()
del foo
```

we [might](https://stackoverflow.com/questions/1481488/what-is-the-del-method-and-how-do-i-call-it/1481512#1481512) get `"I am garbage collected!"`.

JavaScript is based on prototypes rather than classes, so monkey patching involves extending the prototype of the object we want to extend. If we have an application and plan to extend the prototype of a library that no other library uses, that might be ok, but extending native objects such as `String` is a [big no-no](https://www.reddit.com/r/javascript/comments/5ch66r/why_is_extending_native_objects_such_as_string/).

Keep in mind that the problem here is that these native Javascript objects have a [global scope](https://softwareengineering.stackexchange.com/questions/287827/whats-wrong-about-extending-a-class-with-prototype-methods). ClojureScript is able to bypass this issue and extend native objects prototypes safely because it extends the JS prototypes per namespace (if you want to know more about it, watch the talk "ClojureScript Anatomy" at around 19'25").

https://www.youtube.com/watch?v=lC39ifspIf4

So, monkey patching can solve the expression problem. It's convenient and easy to understand. It has several problems though. First of all, only dynamic languages can use it. Second, it's easy to make a mess and forget what code we monkey patched and why. There are some ways to mitigate these issues. For example, in Ruby we can [scope our monkey patches in a module](https://www.justinweiss.com/articles/3-ways-to-monkey-patch-without-making-a-mess/) or use [Ruby refinements](https://blog.alex-miller.co/ruby/2017/07/22/scope-the-monkey.html).

## Multiple dynamic dispatch (aka multimethods)

Some—though not many—programming languages support multiple dispatch. In these languages a function uses more than one piece of information to determine which function to actually call (runtime polymorphism). Usually the pieces of information are the types of the arguments passed to the function.

A language [designed with multiple dispatch in mind](https://nbviewer.org/gist/StefanKarpinski/b8fe9dbb36c1427b9f22) is Julia. In fact in Julia multiple dispatch is so at the core of the language that `+` is a generic function with 96 implementations. And since generic functions are open, functions are more like protocols which users can also implement.

Let's say we have a function `f` which comes from an existing library we don't control (if you want you can try this code in a [Julia REPL](https://docs.julialang.org/en/v1/stdlib/REPL/)).

```julia
f(x::Float64, y::Float64) = 2x + y
```

If we call this function with `f(2.0, 3.0)` we get `7.0`. That's fine and dandy, but what if we write `f(2.0, 3)`? If we do, we get this error.

```shell
julia> f(2.0, 3)
ERROR: MethodError: no method matching f(::Float64, ::Int32)
Closest candidates are:
  f(::Float64, ::Float64) at REPL[1]:1
Stacktrace:
 [1] top-level scope at none:0
```

*On a sidenote, I think that Julia error messages are pretty great, maybe on par with [Elm](https://elm-lang.org/) ones.*

We would really like to call `f` with an integer as its second argument. So what do we do? Well, in Julia we can simply define a new version of the function `f`:

```julia
f(x::Float64, y::Integer) = 2x + y
```

Now if we call `(2.0, 3)` we get `7.0`.

Another language which supports multimethods is Clojure, but I'll write about Clojure multimethods in a future blog post.

## Single dynamic dispatch

In some cases the type of the first argument in a function or method is enough to determine which function to call at runtime. A language that supports this flavor of runtime polymorphism in an elegant and performant way is Clojure.

Clojure methods live outside of types. They don't have to be part of a class like in Java or C++.

Have look at [this clojure gist](https://gist.github.com/elnygren/e34368a86d62f0cb75f04ba903f7834a).

`Triangle` and `Square` are two data structures that obey the `Areable` protocol and the `SelfAware` protocol. If you are not familiar with Clojure, think of them as Java classes `Triangle` and `Square` that implement both the `Areable` and the `SelfAware` interfaces. These clojure protocols (or Java interfaces) define the `area` method and the `whoami` method.

```clojure
; data structures ("shapes")

(defrecord Triangle [a b c])
(defrecord Square [edge])

; protocols

(defprotocol Areable
  (area [shape] "calculates the shape's area"))

(defprotocol SelfAware
  (whoami [shape] "returns the name of the shape"))

; implementations

(extend-type Triangle
  Areable
    (area [{:keys [a b c]}]
      "use Heron's formula to calculate area"
      (let [s (/ (+ a b c) 2)]
        (Math/sqrt (* s (- s a) (- s b) (- s c)))))
  SelfAware
    (whoami [this] "Triangle"))

(extend-type Square
  Areable
    (area [this] (* (:edge this) (:edge this)))
  SelfAware
    (whoami [this] "Square"))
```

Let's say that we want to extend `Triangle` and `Square` to provide new functionality that computes the perimeter.
Without modyfiying existing code, in Clojure we are able to define a new `protocol` that contains the abstract definition of perimeter and provide a concrete implementation for the `Triangle` and the `Square` types.

```clojure
(defprotocol Perimeterable
  (perimeter [shape] "calculates the perimeter of the shape"))

(extend-protocol Perimeterable
  Triangle
    (perimeter [{:keys [a b c]}] (+ a b c))
  Square
    (perimeter [square] (* (:edge square) 4)))
```

By doing so, we gained new functionality for the existing `Triangle` and `Square` types.

```clojure
(let [triangle (->Triangle 1 1 1)]
  ; existing functionality
  (area triangle)
  (whoami triangle)
  ; new functionality
  (perimeter triangle))
```

{% callout "info" %}[Clojure protocols can also extend final Java classes](https://news.ycombinator.com/item?id=1285039), even if I still don't know how they are able to do it.{% endcallout %}

## Other approaches

Open classes and dynamic dispatch (single or multiple) are not the only approaches we can take to solve the expression problem. Here are a few approaches I haven't talked about in this article:

- [Typeclasses](https://eli.thegreenplace.net/2018/more-thoughts-on-the-expression-problem-in-haskell/)
- [Object algebras](https://i.cs.hku.hk/~bruno/oa/) (only available in languages that support generics)
- [Tagless final](https://okmij.org/ftp/tagless-final/index.html)

## References

This blog post was fairly short and introductive, but I hope it taught you a couple of things. If you want to know more about the expression problem—and especially if you are interested in Clojure—have a look at these articles:

- [The Expression Problem and its solutions](https://eli.thegreenplace.net/2016/the-expression-problem-and-its-solutions/)
- [Clojure's Solutions to the Expression Problem](https://www.infoq.com/presentations/Clojure-Expression-Problem/)
- [Solving the expression problem in Clojure](https://max.computer/blog/solving-the-expression-problem-in-clojure/)
- [Solving the Expression Problem with Clojure 1.2](https://www.ibm.com/developerworks/library/j-clojure-protocols/)
