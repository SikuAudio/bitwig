# Akai Midimix Controller Script for Bitwig
This project is a fork of [mfeyx's](https://github.com/mfeyx/akai-midimix-bitwig) script

Forked by [Siku](https://siku.studio/)

[Download ZIP](https://github.com/SikuAudio/akai-midimix-bitwig/archive/refs/heads/main.zip)

# Load the scripts & template

1. Load the `bitwig.midimix` file into the Akai MidiMix Editor and send it to the hardware.
2. Copy the `midimix.control.js` file into the `Controller Scripts` in your `Bitwig Studio` folder (or where you configured it).
3. Copy the folder `MIDI Mix.bwtemplate` to `...\Bitwig\Library\Templates\`.
4. Open `Bitwig` and add the controller.
5. In your Bitwig `Dashboard`, go to `My Templates` and you should find `MIDI Mix` in the list now.

# Install Bitwig Template


# How it's set up

This script is based on my needs. Feel free to modify it :)


### The script provides the following functions:

- Channel faders are mapped to Track 1-8, with max values of "0 db"
- Master fader will handle the main output
- Reverted `Rec Arm`. `Solo`, and `Mute` to their default positions and functionality.
- The `encoders` will control the FX sends, where the top row handles `FX1`, the middle row `FX2`, and the bottom row handles `FX3`.
- The `encoders` will also auto map to project remote control pages. By default I set it to 3 pages of remotes. `Bank Left` and `Bank Right` work as expected.
- `Bank Left` and `Bank Right` are setup to navigate 4 total pages by default. The first page is the `Sends` page and it controls 3 sends per channel, setup vertically. The next 3 pages correspond to the 9 `Project Remote Controls` pages, and the `knobs` are layed out horizontaly to fit 3 `Project Remote Controls` pages per `bank` page.
- To change the amount of pages, simply edit the value `PAGES_AMOUNT` in `midimix.control.js`. You don't need to use multiples of 3.
- The `Solo` button functions as a `Shift` button to allow soloing channels (which is the default MIDI Mix functionality), and additionally shows a popup for which `Bank` page you are currently on (useful when performing live).
- `Send All` works as intented, but only when `Takeover Mode` is set to `Immediate`. As I don't really use it I have no plans to modify this.
- NOTE: Each `knob` automap function can be overwritten by the custom mapping in the Bitwig editor. The rest of the automaps will be unaffected, but the mapped knob will be the same across all `Bank` pages

# To do

- `Bank left` and `Bank right` LEDs are not working.
- `Solo` LEDs are not working

# Plans

I might make another version where instead of using `Project Remotes`, I will map to individual `Track Remotes` and align the knobs vertically across 3 `Bank` pages. If this interests you let me know and I may bump it up my list of priorities.

I may also put more effort into making all LEDs work, but I'm an amateur at programming and don't know if that's a rabbit hole I want to dive into. If you would like a quick modification and don't know how, feel free to messaage me and if I can, I will do it for you.
