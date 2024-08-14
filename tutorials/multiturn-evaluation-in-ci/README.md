# Multiturn in CI Tutorial

This tutorial contains a few examples of testing patterns for agents using MultiTurn evalutions in Okareo.

## Driver Prompts: Jailbreaking

- **Give the driver a high-level description of the jailbreaking strategy.** While longer prompts are capable of jailbreaking the target model, the driver model is equally susceptible to such long prompts. Bearing that in mind, it is best to keep the driver prompt short while asking the driver to send longer prompts to the target model.
- **Add language that tells the driver to stay on task.** By default, the driver model will err on the side of pleasing the "user" (i.e., the target model), and because of this, it is easy for the driver to stray off-task. To remedy this, you should add explicit language asking the driver to be "insistent", "on task", "focused", etc.