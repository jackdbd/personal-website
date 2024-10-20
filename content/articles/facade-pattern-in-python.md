---
date: "2016-11-26T21:12:03.284Z"
tags:
  - design patterns
  - Python
title: Façade pattern in Python
---

Let's continue our journey through the most used design patterns by implementing a _Façade_ pattern in Python.

## Façade is a structural design pattern

_Façade_ can be used to define a simpler, leaner, higher-level, more consistent interface to expose to a _client_ a specific subset of functionalities provided by one or more subsystems. Typically these lower-level subsystems are called _complex parts_. All complex parts controlled by the Façade are often parts of smaller subsystems that are _associated_ one to another.

> Façade builds a _convenient_ interface which saves a client the hassle of
> dealing with _complex parts_.

Note that the client can still have direct access to these functionalities: the Façade does not - and should not - prevent the client from accessing the complex parts.

> Subsystem implementation gains _flexibility_, client gains _simplicity_.

The [caret package in R](https://topepo.github.io/caret/index.html) is a great example of a Façade, because it wraps a collection of APIs into a single well-designed API. The R programming language contains a huge number of packages for implementing almost all statistical models ever created. Unfortunately, more often then not, these packages have their own specific syntax, so when training/testing the model, one must know the syntax for the model being used. Caret implements a set of functions that provide a uniform interface when creating predictive models (e.g. the functions `train` and `predict`), but if you want you can still use the original syntax to train/test a specific model.

## Façade Pattern in Python

To illustrate a Façade pattern I will use a car as an example: you would like to have access to a set of functionalities when using a car (e.g. drive, park, etc), but you probably don't want to deal with all the complex parts a car is composed of.

In this example I decided to implement the complex parts as private classes. Since this is python, we can still access these classes without any issue. I just make them private to suggest that the client should call the Façade, not the complex parts directly.

The Complex parts.

```python
class _IgnitionSystem(object):

    @staticmethod
    def produce_spark():
        return True


class _Engine(object):

    def __init__(self):
        self.revs_per_minute = 0

    def turnon(self):
        self.revs_per_minute = 2000

    def turnoff(self):
        self.revs_per_minute = 0


class _FuelTank(object):
    def __init__(self, level=30):
        self._level = level

    @property
    def level(self):
        return self._level

    @level.setter
    def level(self, level):
        self._level = level


class _DashBoardLight(object):

    def __init__(self, is_on=False):
        self._is_on = is_on

    def __str__(self):
        return self.__class__.__name__

    @property
    def is_on(self):
        return self._is_on

    @is_on.setter
    def is_on(self, status):
        self._is_on = status

    def status_check(self):
        if self._is_on:
            print('{}: ON'.format(str(self)))
        else:
            print('{}: OFF'.format(str(self)))


class _HandBrakeLight(_DashBoardLight):
    pass


class _FogLampLight(_DashBoardLight):
    pass


class _Dashboard(object):

    def __init__(self):
        self.lights = {'handbreak': _HandBrakeLight(), 'fog': _FogLampLight()}

    def show(self):
        for light in self.lights.values():
            light.status_check()
```

The Façade.

```python
class Car(object):
    def __init__(self):
        self.ignition_system = _IgnitionSystem()
        self.engine = _Engine()
        self.fuel_tank = _FuelTank()
        self.dashboard = _Dashboard()

    @property
    def km_per_litre(self):
        return 17.0

    def consume_fuel(self, km):
        litres = min(self.fuel_tank.level, km / self.km_per_litre)
        self.fuel_tank.level -= litres

    def start(self):
        print('\nStarting...')
        self.dashboard.show()
        if self.ignition_system.produce_spark():
            self.engine.turnon()
        else:
            print('Can\'t start. Faulty ignition system')

    def has_enough_fuel(self, km, km_per_litre):
        litres_needed = km / km_per_litre
        if self.fuel_tank.level > litres_needed:
            return True
        else:
            return False

    def drive(self, km=100):
        print('\n')
        if self.engine.revs_per_minute > 0:
            while self.has_enough_fuel(km, self.km_per_litre):
                self.consume_fuel(km)
                print('Drove {}km'.format(km))
                print('{:.2f}l of fuel still left'.format(self.fuel_tank.level))
        else:
            print('Can\'t drive. The Engine is turned off!')

    def park(self):
        print('\nParking...')
        self.dashboard.lights['handbreak'].is_on = True
        self.dashboard.show()
        self.engine.turnoff()

    def switch_fog_lights(self, status):
        print('\nSwitching {} fog lights...'.format(status))
        boolean = True if status == 'ON' else False
        self.dashboard.lights['fog'].is_on = boolean
        self.dashboard.show()

    def fill_up_tank(self):
        print('\nFuel tank filled up!')
        self.fuel_tank.level = 100
```

The Client here is simply the main function.

```python
def main():
    car = Car()
    car.start()
    car.drive()

    car.switch_fog_lights('ON')
    car.switch_fog_lights('OFF')

    car.park()
    car.fill_up_tank()
    car.drive()

    car.start()
    car.drive()

if __name__ == '__main__':
    main()
```

You need the code? Grab it [here](https://github.com/jackdbd/design-patterns)!
