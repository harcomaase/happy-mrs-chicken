# happy mrs chicken

(german name: "Das Huhn hat zu tun")

This is going to be an implementation of the game "Happy Mrs. Chicken" from
the children television series "Peppa Pig"

One of the game goals is to teach younglings what it means to be a programmer :)

All of the graphics and sounds will be self-made, so hopefully there won't be
any copyright problems! If there is a problem, please create an issue.

## current state

Try it out here: https://harcomaase.github.io/happy-mrs-chicken/

### gameplay

- you can tap on a moving chicken. It will stop and lay an egg
- after the chicken layed the egg, it starts moving again
- after some time a new chicken hatches from the egg
- the new chicken is immediately able to lay eggs
- there is a limit of on-screen chickens, you won't believe what happens when that limit is reached!

### technical

- the canvas occupies the full page
- the page can be installed as PWA

### art

- images and animations are available
- animations yet to be implemented

## very rough roadmap

Since our customer did not provide a specification sheet for this project, we
choose an agile approach. The plan is to develop a prototype early on, in order
to give the customer a first impression. After that, they will be
incorporated into each development cycle, as well as the acceptance tests.

- [x] draw picture on fullscreen canvas
- [x] draw pictures on input event
- [x] browser campatibility (webapp)
- [ ] sprites / animations
- [ ] sound
- [x] first game mechanics
  - [x] rough game loop
  - [x] lay egg on tap
  - [x] move somewhere else
  - [x] goal, or reset possibility
- [x] text, debug stats
- [ ] game state, intro screen, end screen
  - [x] welcome screen
  - [ ] game over screen
- [ ] game mechanics finalisation
- [ ] levels? Faster movement?
- [ ] multiplayer?


