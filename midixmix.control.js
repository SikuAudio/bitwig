loadAPI(18)

host.defineController("Akai", "Akai Midimix", "0.1", "cade9554-293e-494c-8e38-4da5fc20c353", "Siku")
host.addDeviceNameBasedDiscoveryPair(["MIDI Mix"], ["MIDI Mix"])
host.defineMidiPorts(1, 1)


/* ------------------------------------------------------ */
/*                      REMOTE PAGES                      */
/* ------------------------------------------------------ */
var pages = []
const PAGE_AMOUNT = 9


/* ------------------------------------------------------ */
/*                    DEBUGGING FEATURE                   */
/* ------------------------------------------------------ */
var DEBUG = true

function debug(bool = false) {
   DEBUG = bool
   return
}

/* ------------------------------------------------------ */
/*                         LOGGING                        */
/* ------------------------------------------------------ */
function log(msg) {
   if (DEBUG) { println(msg) }
}

/* ------------------------------------------------------ */
/*                       MIDI SPECS                       */
/* ------------------------------------------------------ */
const ON = 127
const OFF = 0

const NOTE_ON = 0x90
const NOTE_OFF = 0x80
const CC = 0xb0


/* ------------------------------------------------------ */
/*                          NAMES                         */
/* ------------------------------------------------------ */
const KNOB = "encoder"
const MAIN = "mainVolume"
const CHAN = "chanVolume"

// do not change those values,
// they are called like the api methods, e.g. channel.solo()
const MUTE = "mute"
const RECO = "arm"
const SOLO = "solo"


/* ------------------------------------------------------ */
/*                         CONSTS                         */
/* ------------------------------------------------------ */
var SHIFT_PRESSED = false
var SELECTED_PAGE = 0


/* ------------------------------------------------------ */
/*                        HARDWARE                        */
/* ------------------------------------------------------ */

/* ----------------- BUTTONS RIGHT PANEL ---------------- */
const BANKL = 0x19  // 25
const BANKR = 0x1A  // 26
const SHIFT = 0x1B  // 27

/* ----------------------- ENCODER ---------------------- */
const KNOBS = {
   "30": { send: 0, chan: 0, param: 0, page: 0,},
   "31": { send: 0, chan: 1, param: 1, page: 0,},
   "32": { send: 0, chan: 2, param: 2, page: 0,},
   "33": { send: 0, chan: 3, param: 3, page: 0,},
   "34": { send: 0, chan: 4, param: 4, page: 0,},
   "35": { send: 0, chan: 5, param: 5, page: 0,},
   "36": { send: 0, chan: 6, param: 6, page: 0,},
   "37": { send: 0, chan: 7, param: 7, page: 0,},
   "38": { send: 1, chan: 0, param: 0, page: 1,},
   "39": { send: 1, chan: 1, param: 1, page: 1,},
   "40": { send: 1, chan: 2, param: 2, page: 1,},
   "41": { send: 1, chan: 3, param: 3, page: 1,},
   "42": { send: 1, chan: 4, param: 4, page: 1,},
   "43": { send: 1, chan: 5, param: 5, page: 1,},
   "44": { send: 1, chan: 6, param: 6, page: 1,},
   "45": { send: 1, chan: 7, param: 7, page: 1,},
   "46": { send: 2, chan: 0, param: 0, page: 2,},
   "47": { send: 2, chan: 1, param: 1, page: 2,},
   "48": { send: 2, chan: 2, param: 2, page: 2,},
   "49": { send: 2, chan: 3, param: 3, page: 2,},
   "50": { send: 2, chan: 4, param: 4, page: 2,},
   "51": { send: 2, chan: 5, param: 5, page: 2,},
   "52": { send: 2, chan: 6, param: 6, page: 2,},
   "53": { send: 2, chan: 7, param: 7, page: 2,}
}

/* ----------------- CHANNEL CONTROLLER ----------------- */
const CC_MAPPING = {
   [KNOB]: {
      lo: 30,
      hi: 53,
   },
   [MUTE]: {
      lo: 12,
      hi: 19
   },
   [RECO]: {
      lo: 2,
      hi: 9,
   },
   [SOLO]: {
      lo: 20,
      hi: 27,
   },
   [CHAN]: {
      lo: 92,
      hi: 99
   },
   [MAIN]: 54
}

/* ------------------------- LED ------------------------ */
const LED_MUTE = [0x01, 0x04, 0x07, 0x0A, 0x0D, 0x10, 0x13, 0x16]
const LED_RECO = [0x03, 0x06, 0x09, 0x0C, 0x0F, 0x12, 0x15, 0x18]
const LED_SOLO = [0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B]  // ! NOT WORKING ATM

const LED_MAPPING = {
   [MUTE]: LED_MUTE, // row 1
   [SOLO]: LED_SOLO, // shift + row 1
   [RECO]: LED_RECO, // row 2
}

const LED_CACHE = {
   [MUTE]: [0, 0, 0, 0, 0, 0, 0, 0],
   [RECO]: [0, 0, 0, 0, 0, 0, 0, 0],
   [SOLO]: [0, 0, 0, 0, 0, 0, 0, 0],
}

/* ------------------------------------------------------ */
/*                         HELPERS                        */
/* ------------------------------------------------------ */
function isCCRangeMapped(name, cc) {
   var map = CC_MAPPING[name]
   return (cc >= map.lo && cc <= map.hi)
}

function toggleValue(value) {
   return value === 0 ? 127 : 0
}

function toggle(val) {
   return val === 127 ? 0 : 127
}

function toBool(val) {
   return val === 127 ? true : false
}

function handleError(error) {
   println(`${error.name}: ${error.message}`)
   return
}


/* ------------------------------------------------------ */
/*                     INIT CONTROLLER                    */
/* ------------------------------------------------------ */
function init() {
   // sending to host (bitwig)
   midiIn = host.getMidiInPort(0)
   midiIn.setMidiCallback(onMidi)

   // sending to controller (midimix) -> LED
   midiOut = host.getMidiOutPort(0)

   // 8 channel faders, 3 sends, 0 scenes
   trackBank = host.createMainTrackBank(8, 3, 0)

   // main fader
   mainFader = host.createMasterTrack(0)

   // pointer for overall project
   var project = host.getProject()

   // pointer for project track group, which includes the project remotes
   var rootTrackGroup = project.getRootTrackGroup()

   // create PAGE_AMOUNT pages of remotes and appends each page to pages array
   for (let i = 0; i < PAGE_AMOUNT; i++) {
      pages.push(rootTrackGroup.createCursorRemoteControlsPage("1", 8, `${i + 1}`))
   }
}

function exit() {
   log("exit()")
}

/* ------------------------------------------------------ */
/*                   MIDI STATUS HANDLER                  */
/* ------------------------------------------------------ */

/* ----------------------- NOTE ON ---------------------- */
function handleNoteOn(cc, value) {
   try {
      log(`handleNoteOn -> ${cc} : ${value}`)
      switch (cc) {
         case BANKL:
            if (SELECTED_PAGE > 0) { SELECTED_PAGE-- }
            log("BANK LEFT ON")
            break
         case BANKR:
            if (SELECTED_PAGE < Math.ceil(PAGE_AMOUNT / 3)) { SELECTED_PAGE++ }
            log("BANK RIGHT ON")
            break
         case SHIFT:
            SHIFT_PRESSED = !SHIFT_PRESSED && cc == SHIFT
            log(`SHIFT pressed: ${SHIFT_PRESSED}`)
            break
         default:
            break
      }
      log(SELECTED_PAGE)
      if(SELECTED_PAGE === 0){
         host.showPopupNotification("Sends")
      } else {
         host.showPopupNotification(`Remote Controls Page ${SELECTED_PAGE}`)
      }
      return
   } catch (error) {
      handleError(error)
   }
}

/* ---------------------- NOTE OFF ---------------------- */
function handleNoteOff(cc, value) {
   try {
      log(`handleNoteOff -> ${cc} : ${value}`)
      switch (cc) {
         case BANKL:
            log("BANK LEFT OFF")
            break;
         case BANKR:
            log("BANK RIGHT OFF")
            break;
         case SHIFT:
            SHIFT_PRESSED = !SHIFT_PRESSED && cc == SHIFT
            log(`SHIFT pressed: ${SHIFT_PRESSED}`)
            break;
         default:
            break;
      }
      return
   } catch (error) {
      handleError(error)
   }
}

/* --------------------- MAIN FADER --------------------- */
function handleMainVolume(cc, value) {
   log(`Main Fader -> ${cc} : ${value}`)
   mainFader.getVolume().setRaw(value / 127)
}

/* -------------------- CHANNEL FADER ------------------- */
function handleChannelVolume(cc, value) {
   try {
      var index = cc - CC_MAPPING[CHAN].lo
      var channel = trackBank.getChannel(index)
      var volume = (value / 127) //* 0.8
      channel.getVolume().setRaw(volume)
      log(`Changing volume of channel ${index + 1} to ${value}`)
      return
   } catch (error) {
      handleError(error)
   }
}

/* ----------------------- BUTTONS ---------------------- */
function handleButton(cc, type, value) {
   try {
      if (value === ON) {
         var index = cc - CC_MAPPING[type].lo
         var channel = trackBank.getChannel(index)
         var value = toggleValue(LED_CACHE[type][index])
         channel[type]().set(toBool(value))
         var led = LED_MAPPING[type][index]
         LED_CACHE[type][index] = value
         midiOut.sendMidi(NOTE_ON, led, value)
         log(`handleButton -> CH${index + 1} : ${type}`)
         return
      }
      return
   } catch (error) {
      handleError(error)
   }
}

/* ---------------------- ENCODERS ---------------------- */
function handleEncoder(cc, value) {
   try {
      log(`handleChannelEncoder -> ${cc} : ${value}`)
      switch (true) {
         case SELECTED_PAGE === 0:
            var chan_index = KNOBS[cc].chan
            var send_index = KNOBS[cc].send
            var channel = trackBank.getChannel(chan_index)
            channel.getSend(send_index).set(value, 128)
            break;
         case SELECTED_PAGE > 0:
            var page_index = KNOBS[cc].page + ((SELECTED_PAGE - 1) * 3)
            println(`SELECTED_PAGE  = ${SELECTED_PAGE}`)
            println(`page_index  = ${page_index}`)
            var param_index = KNOBS[cc].param
            println(`param_index = ${param_index}`)
            pages[page_index].getParameter(param_index).set(value, 128)
            break;
      }
      return
   } catch (error) {
      handleError(error)
   }
}


/* ------------------------------------------------------ */
/*                   MIDI INPUT HANDLER                   */
/* ------------------------------------------------------ */
function onMidi(status, cc, value) {
   log(`${status} ${cc} ${value}`)
   switch (true) {
      case isNoteOn(status): handleNoteOn(cc, value); break;
      case isNoteOff(status): handleNoteOff(cc, value); break;

      case isChannelController(status):
         switch (true) {
            case isNoteOn(status): handleNoteOn(cc, value); break;
            case isNoteOff(status): handleNoteOff(cc, value); break;

            case isChannelController(status):
               // main volume
               if (cc === CC_MAPPING[MAIN]) { handleMainVolume(cc, value); break; }

               // channel volume
               if (isCCRangeMapped(CHAN, cc)) { handleChannelVolume(cc, value); break; }

               // buttons
               if (isCCRangeMapped(SOLO, cc)) { handleButton(cc, SOLO, value); break; }
               if (isCCRangeMapped(MUTE, cc)) { handleButton(cc, MUTE, value); break; }
               if (isCCRangeMapped(RECO, cc)) { handleButton(cc, RECO, value); break; }

               // encoders
               if (isCCRangeMapped(KNOB, cc)) { handleEncoder(cc, value); break; }

               // end
               break;

            default:
               println(`UNKNOWN STATUS: ${status}, cc: ${cc}, value: ${value}`)
               break;
         }
         return
   }
}
