---
date: "2020-09-11T12:00:00.000Z"
tags:
  - methodology
  - microservices
  - domain-driven design
title: Event Storming, simplified
---
The first time I've heard about Event Storming was when I watched the excellent talk [Designing event-first microservices](https://www.infoq.com/presentations/microservices-events-first-design/) by Jonas Bonér, creator of the [Akka](https://github.com/akka/akka) project.

Event Storming is a workshop-based method that you can employ when designing a new system or product. You run this workshop before developing any feature. You gather engineers, domain experts and decision makers, and you make them write post-it notes where they write **domain events**.
A domain event is something meaningful that **happened** in the domain. The emphasys on happened is because domain events must be expressed with the **past tense**.

## Why starting from events?

Event Storming starts from events because it recognizes that a system should be designed with its domain in mind (Domain-Driven Design), and in In DDD events are first-class citizens: you view the world (i.e. the business domain) through events.

As Greg Young—creator of the Event Sourcing architectural pattern—puts it:

> When you start modeling events, it forces you to think about the behavior of the system. As opposed to thinking about the structure of the system.

## Commands and Actors

Events do not appear from nothing. They are the product of some process executed by some person or some program.
Following the Event Storming terminology, the process is called **command**, and the person or thing that executed the command is called **actor**.

```text
Actor --> |executes| --> Command --> |causes| --> Domain Event
```

## Other components

Event Storming introduces additional components:

- **Aggregates**: a cluster of domain objects that can be treated as a single unit.
- **External System**: some third-party service provider such as a payment gateway or shipping company.
- **Business Process**: it processes a command according to business rules and logic. Creates one or more domain events.
- **User**: the person who executes a command through a view.
- **View**: the view the users interact with to carry out a task in the system.

I don't think that these components are really necessary though. Or at least they are far less important than domain events, commands and actors. Here is why.

**Aggregates**. Since we are using Event Storming before developing any feature, it can be hard or impossible to group domain events in a single unit. Another issue is that there can be some overlap between aggregates: the same domain event could belong to more than one aggregate. As far as I know, Event Storming doesn't propose a solution on how to deal with this issue. Also, I am not sure about the real value of knowing the aggregates of the business domain we are modeling. I think it can be useful from an engineering standpoint, but less so from a business standpoint.

**External System**. I think we should consider third-party service providers as just another actor. In fact, in a microservice architecture there should be no difference between a service implemented internally in our company and a service from a third-party provider: both services are opaque to us and we can communicate with them only via their public APIs.

**Business Process**. Again, a business process *processes commands*, so I think it's fair to view it as just another actor.

**User**. Sure, it can be valuable to identify users of our system. But users execute commands, so they are just a particular kind of actors.

**View**. First of all, there can be no view. If the actor is a cron process that executes a command, and that command creates some domain event, then there is no view involved. Second, even when there is a user operating a portion of the system, I don't think that identifying the view at this stage of the requirements gathering is that important.

## Conclusion

Event Storming can be a great way to gather business and engineering requirements. I agree that viewing the world through events—namely modeling our business domain starting from domain events—is a valid approach. At the moment I just don't see the need of introducing additional concepts when actors, command and events suffice. It's possible that I'm just missing something important though. I know that Alberto Brandolini is writing a [book about Event Storming](https://en.wikipedia.org/wiki/Event_storming), and I plan to read it when it's ready. I might change my mind if I find something interesting in it.

## References

- [Introducing Event Storming (by Alberto Brandolini)](https://ziobrando.blogspot.com/2013/11/introducing-event-storming.html)
- [Event Storming (Wikipedia)](https://en.wikipedia.org/wiki/Event_storming)
