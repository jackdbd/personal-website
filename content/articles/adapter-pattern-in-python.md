---
date: "2016-11-26T09:12:03.284Z"
tags:
  - design patterns
  - Python
title: Adapter pattern in Python
---

Some weeks ago I decided to start studying design patterns and implementing them in Python. _Design patterns_ and _Head first in design patterns_ are constantly cited for being really good books. I added them to my reading list some time ago, but I still haven't managed to read them so far. Nonetheless, I've read several blog posts, articles on Wikipedia and answers on Stack Overflow and started implementing some of these patterns.

Here we are going to see the _Adapter_ pattern.

## Adapter is a structural design pattern

Structural design patterns are concerned with how classes and objects are _composed_ to form larger structures. They help to use classes or methods which may not be usable directly, or they can ease the design by identifying a simple way to build relationships between entities.

_Adapter_ allows a _Client_ to access otherwise not directly accessible functionalities of a _Supplier_ . Adapter makes things work after they are designed: it produces an interface for a single object or class, and _adapts_ such class in a way that a _Client_ can use it.

> You have got _this_, and you **need** _that_.

## How do we implement the Adapter Pattern?

There are two ways of implementing the Adapter pattern:

1.  Object Adapter
2.  Class Adapter

The object adapter uses **encapsulation**, while the class adapter uses **multiple inheritance** (Python supports both encapsulation and multiple inheritance).

Let's imagine that you have a smartphone (client) and you want to charge it. In order to charge a mobile phone you need a direct current (DC) and an input voltage of a few volts (from 3.7V to 5.2V I suppose), so you can't simply plug it directly into a wall socket (supplier), which provides an alternate current (AC) and outputs either 230V (in Europe) or 120V (in the US). Namely, without a phone charger (the Adapter) you **can't** charge your phone.

_In the following code I implemented both a European Socket class and and an American Socket class because they will be useful later on when explaining the Class Adapter approach. For now you can ignore the USSocket class._

```python
# Client
class Smartphone(object):

    max_input_voltage = 5

    @classmethod
    def outcome(cls, input_voltage):
        if input_voltage > cls.max_input_voltage:
            print("Input voltage: {}V -- BURNING!!!".format(input_voltage))
        else:
            print("Input voltage: {}V -- Charging...".format(input_voltage))

    def charge(self, input_voltage):
        """Charge the phone with the given input voltage."""
        self.outcome(input_voltage)


# Supplier
class Socket(object):
    output_voltage = None

class EUSocket(Socket):
    output_voltage = 230

class USSocket(Socket):
    output_voltage = 120
```

This is the current scenario:

{% table %}
Client,Supplier
Smartphone,EUSocket
{% endtable %}

If you take a Smartphone instance and you call `charge` with `EUSocket.output_voltage` as argument, you will fail at charging your phone.

```python
smartphone = Smartphone()
smartphone.charge(EUSocket.output_voltage)
>>> Input voltage: 230V -- BURNING!!!
```

## 1. Object Adapter

Obvioulsy, you need a phone charger to charge your smarthone. You can think of this phone charger as a completely independent _entity_ from the smartphone and the wall socket. This new entity encapsulates client and supplier, and allows you to call the `charge` method without changing anything, neither in the Smartphone class, nor the Socket class. The phone charger converts an alternate current, high voltage power supply, into a direct current, low voltage power supply that can be used to charge the smartphone.

```python
class EUAdapter(object):
    """EUAdapter encapsulates client (Smartphone) and supplier (EUSocket)."""
    input_voltage = EUSocket.output_voltage
    output_voltage = Smartphone.max_input_voltage
```

The EUAdapter class is a Supplier to the Smartphone class, and at the same time it's a Client to the EUSocket class.

{% table %}
Client,Supplier
Smartphone,EUAdapter
EUAdapter,EUSocket
{% endtable %}

If you now take a Smartphone instance and call `charge` with `EUAdapter.output_voltage` as argument, you can finally charge your phone.

```python
smartphone.charge(EUAdapter.output_voltage)
>>> Input voltage: 5V -- Charging...
```

## 2. Class Adapter

You can also think that the combination smartphone + phone charger _defines_ a unique system which can directly use the wall socket.

You started with a `Smartphone` and a `Socket`, and now you want to define a system which inherits methods and attributes both from `Smartphone` and `Socket`. You have to use _multiple inheritance_.

With this approach you don't create a new entity between the client and the supplier, but you redefine the client in a way that it can directly work with the supplier. You don't have a `Smartphone` any longer, you have a new entity which is the combination of a `Smartphone` and a `Socket`.

Since you are getting the `output_voltage` from a `Socket`, you have to define a method `transform_voltage` to convert a high voltage AC to a low voltage DC. Then you need to override the `charge` method inherited from `Smartphone` and call `transform_voltage` before calling the `outcome` method.

I decided to have two subclasses of Socket to make this example a bit closer to the real world. When you take a Smartphone and a Socket, you define a system which will work for that Smartphone and **that specific type of Socket** (e.g. USSocket), but will not work with the same Smartphone and a different type of Socket (EUSocket).

```python
class CannotTransformVoltage(Exception):
    """Exception raised by the SmartphoneAdapter.

    This exception represents the fact that an adapter can not provide the
    right voltage to the Smartphone if the voltage of the Socket is wrong."""
    pass


class SmartphoneAdapter(Smartphone, Socket):

    @classmethod
    def transform_voltage(cls, input_voltage):
        if input_voltage == cls.output_voltage:
            return cls.max_input_voltage
        else:
            raise CannotTransformVoltage(
                "Can\'t transform {0}-{1}V. This adapter transforms {2}-{1}V."
                .format(input_voltage, cls.max_input_voltage,
                        cls.output_voltage))

    @classmethod
    def charge(cls, input_voltage):
        try:
            voltage = cls.transform_voltage(input_voltage)
            cls.outcome(voltage)
        except CannotTransformVoltage as e:
            print(e)


class SmartphoneEUAdapter(SmartphoneAdapter, EUSocket):
    """System (smartphone + adapter) for a European Socket.

    Note: SmartphoneAdapter already inherited from Smartphone and Socket, but by re-inheriting from EUSocket we redefine all the stuff inherited from Socket.
    """ pass


class SmartphoneUSAdapter(SmartphoneAdapter, USSocket):
    """System (smartphone + adapter) for an American Socket."""
    pass
```

Here are the two classes you are dealing with:

{% table %}
Client,Supplier
SmartphoneEUAdapter,EUSocket
{% endtable %}

If you now take a `SmartphoneEUAdapter` instance and call `charge` with `EUSocket.output_voltage` as argument, you can see that you can charge your phone. However, if you take the same instance and call `charge` with `USSocket.output_voltage` as argument, you get a `CannotTransformVoltage` exception. In the latter case, you are using the wrong Adapter for a particular Supplier.

```python
smarthone_with_eu_adapter = SmartphoneEUAdapter()
smarthone_with_eu_adapter.charge(EUSocket.output_voltage)
>>> Input voltage: 5V -- Charging...

smarthone_with_eu_adapter.charge(USSocket.output_voltage)
>>> Can't transform 120-5V. This adapter transforms 230-5V.
```

## Object adapter or Class Adapter?

There are two [strong reasons](https://stackoverflow.com/questions/5467005/adapter-pattern-class-adapter-vs-object-adapter) to prefer the Object Adapter over the Class Adapter:

* loose coupling
* multiple inheritance is tricky

With the Object Adapter you have [loose coupling](https://en.wikipedia.org/wiki/Loose_coupling), so the Client is not required to know anything about the Supplier. The Smartphone doesn't care where it gets its 5 volts. As long as it gets them, it will charge.

With the Class Adapter you lose this property, because you have a new entity which is _defined_ by the Client and the Supplier, and it works only for this specific type of Client and specific type of Supplier (e.g. SmartphoneEUAdapter doesn't work with a USSocket). This means that you have created an interface which allows you to use the Client and the Supplier, but where Client and Supplier are _strongly coupled_. Since you usually want to design interfaces to _uncouple_ things, this is not a desired property.

Another reason why I decided to define two subclasses of Socket is to show that multiple inheritance can be tricky. As we can see in the code above, `SmartphoneAdapter` already contains all attributes and methods from `Smartphone` and `Socket`. However, since what you really want to use are the subclasses of `Socket`, namely `EUSocket` and `USSocket`, you need to re-inherit when you subclass `SmartphoneAdapter`. You can use a different strategy and create `SmartphoneEUAdapter` by directly inheriting from `Smartphone` and `EUSocket`, but then you would need to do the same for `SmartphoneUSAdapter`, which needs to inherit from `Smartphone` and `USSocket`. This will result in duplicate code, because you would need to write `transform_voltage` and `charge` twice.

You need the code? Grab it [here](https://github.com/jackdbd/design-patterns)!
