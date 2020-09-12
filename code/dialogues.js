const Yield = 1;
const TheEnd = 0;

const PatataScript = [
    [
        `Ratita!`, `It's so nice to`, `see you!`,
        `Thanks for`, `visiting me`, 
        Yield,
        `Do you want`, `to help me`, `prepare la once?`,
        Yield,
        `First I need you to`, 
        `help me get`, `10 pieces`, `of timber`,
        `so I can start`, `the fire on`, `the stove.`,
        Yield,
        `This is how`, `timber looks`, `around here.`, ``,
        TheEnd
    ],
    [
        `Thanks my ratita!`, `This is perfect`,
        `I'll turn on`, `the stove`, `right away.`,
        Yield,
        `Sure!`, `But I ran out`, `of apples.`, `Could you`, `pick up 8 apples?`, ``,
        Yield,
        `This is how`, `apples look`, `around here.`, ``,
        TheEnd
    ],
    [
        `Have patience`, `my little ratita.`, `I'll prepare for you`, `a sweet apple pie.`,
        `In the meantime,`, `could you`, `grab 4 mint leaves`, `from the forest` , `so we can make`, `a nice cup`, `of mint tea?`,
        Yield, 
        `Yes, honey.`, `We just need`,`4 of them`,`and we'll be ready.`,
        Yield,
        `Thank you!`, `This is how`, `mint looks`, `around here.`, ``,
        TheEnd
    ],
    [
        `Thank you my ratita!`, `They smell so fresh!`, `They'll be excellent`, `for a tasty brew.`,
        Yield,
        `Yes! of course.`, `It should be`, `warm inside now.`, ``, `Thanks so much`, `for all the help`,
        `I love when you`, `come and visit me.`, ``,``,``,``, `I love you my ratita.`, ``,
        Yield
    ]
];

const RatitaScript = [
    [
        `Abuela Patata!`, `You know I love`, `coming here.`,
        Yield,
        `Of course!`, `I'd love to.`,
        Yield,
        `Ok bueli!`, `I'll look around`, `for some dry timber.`, ``,
        Yield
    ],
    [
        `Bueli Patata,`,`I picked up the timber`, `I hope it's enough.`,
        Yield,
        `That's great!`, `Could we get some of`, `your delicious`, `apple pie?`,
        Yield,
        `Ok bueli!`, `I'll go look for some!`, ``,
        Yield
    ],
    [
        `Here are the apples`, `I am already hungry!`,
        Yield,
        `Of course!`, `I love your mint tea!`, `They are near`, `the edge`, `of the forest`, `right?`,
        Yield,
        `Ok! I'll get to work.`, ``,
        Yield
    ],
    [
        `Here's the mint bueli.`, `Should be enough`, `for a couple of`, `cups of your nice`, `mint tea.`,
        Yield,
        `I am counting on that.`, `...`, `Shall we enjoy`, `our once?`, 
        Yield,
        `  `, `I love you too, bueli!`, ``,
        TheEnd
    ]
];

const Dialogues = {

    isActive: false,
    mainIndex: 0,
    activeSpeaker: null,
    nextSpeaker: null,
    textRenderer: null,
    textLength: 0,
    charDelay: 0,
    popText: false,
    currentText: '',
    onComplete: null,

    init: (rata, patata) => {
        Dialogues.Rata.gameObject = rata;
        Dialogues.Patata.gameObject = patata;
        Dialogues.starter = [
            Dialogues.Patata,
            Dialogues.Rata,
            Dialogues.Rata,
            Dialogues.Rata,
        ];
        Dialogues.setDialogue(0);
        Dialogues.textRenderer = TextBuffer.createTextBuffer(700, 200, '', 40, 50);
    },

    setDialogue: (index) => {
        if (index >= 0 && index < Dialogues.starter.length) {
            Dialogues.mainIndex = index;
            Dialogues.Patata.index = 0;
            Dialogues.Rata.index = 0;
            Dialogues.isActive = true;
            Dialogues.activeSpeaker = Dialogues.starter[index];
            Dialogues.nextSpeaker = Dialogues.activeSpeaker;
        }
    },

    getText: () => {
        if (!Dialogues.isDone()) {
            return Dialogues.activeSpeaker.getText();
        }
        else
            return '';
    },
    d: 0,
    f: 1,
    update: () => {
        if (Dialogues.isDone()) return;
        if (Dialogues.textLength <= Dialogues.currentText.length + 3) {
            if (Dialogues.charDelay <= 0) {
                Dialogues.textLength += 1;
                Dialogues.charDelay = 1;
                if ((Dialogues.f-=0.3) <= 0 && (Dialogues.d -= 0.55) < 0) {
                    zzfxV=0.008;
                    Dialogues.activeSpeaker.sound();
                    zzfxV=0.2;
                    Dialogues.d = 1;
                }
            } else {
                Dialogues.charDelay -= 0.3;
            }
        } else {
            Dialogues.activeSpeaker = Dialogues.nextSpeaker;
            Dialogues.currentText = Dialogues.getText();
            Dialogues.textLength = 0;
            Dialogues.charDelay = 1;
            Dialogues.f = 1;
        }
    },

    render: () => {
        if (!Dialogues.isDone()) {
            Dialogues.textRenderer.setText(
                Dialogues.currentText.substr(0, Math.min(Dialogues.textLength, Dialogues.currentText.length)), 
                Dialogues.activeSpeaker.color
            );
            Dialogues.textRenderer.render(Mat4.trans(Mat4.makeIdent(), [
                Dialogues.activeSpeaker.gameObject.position[0],
                Dialogues.activeSpeaker.gameObject.position[1] + 10,
                Dialogues.activeSpeaker.gameObject.position[2]
            ]));
        }
    },

    starter: null,

    Patata: {
        sound: () => zzfx(...[,,500,.02,,0,,1.4,,,,,,,5.7,,.23,.6]),
        color: '#ffeeaa',
        gameObject:  null,
        index: 0,
        script: PatataScript,
        renderText: (text) => {
            if (Dialogues.isDone()) {
                Dialogues.textRenderer.setText(text,Dialogues.Patata.color);
                Dialogues.textRenderer.render(Mat4.trans(Mat4.makeIdent(), [
                    Dialogues.Patata.gameObject.position[0],
                    Dialogues.Patata.gameObject.position[1] + 10,
                    Dialogues.Patata.gameObject.position[2]
                ]));
            }
        },
        getText: () => {
            if (Dialogues.mainIndex < Dialogues.Patata.script.length) {
                const output = Dialogues.Patata.script[Dialogues.mainIndex][Dialogues.Patata.index];
                if (output.constructor !== String) {
                    return '-';
                }
                const next = Dialogues.Patata.script[Dialogues.mainIndex][Dialogues.Patata.index + 1];
                Dialogues.Patata.index += 1;
                if (next === TheEnd) {
                    Dialogues.isActive = false;
                    Dialogues.Patata.index = 0;
                    Dialogues.Rata.index += 1;
                    Dialogues.onComplete && Dialogues.onComplete(Dialogues.mainIndex);
                } else if (next === Yield) {
                    Dialogues.f = 0;
                    Dialogues.nextSpeaker = Dialogues.Rata;
                    Dialogues.Patata.index += 1;
                }
                return output;
            }
            return '...';
        }
    },

    Rata: {
        sound: () => zzfx(...[,,999,.02,,0,,1.4,,,,,,,5.7,,.23,.6]),
        color: '#aaeeff',
        gameObject:  null,
        index: 0,
        script: RatitaScript,
        renderText: (text) => {
            if (Dialogues.isDone()) {
                Dialogues.textRenderer.setText(text,Dialogues.Rata.color);
                Dialogues.textRenderer.render(Mat4.trans(Mat4.makeIdent(), [
                    Dialogues.Rata.gameObject.position[0],
                    Dialogues.Rata.gameObject.position[1] + 10,
                    Dialogues.Rata.gameObject.position[2]
                ]));
            }
        },
        getText: () => {
            if (Dialogues.mainIndex < Dialogues.Rata.script.length) {
                const output = Dialogues.Rata.script[Dialogues.mainIndex][Dialogues.Rata.index];
                if (output.constructor !== String) {
                    return '-';
                }
                const next = Dialogues.Rata.script[Dialogues.mainIndex][Dialogues.Rata.index + 1];
                Dialogues.Rata.index += 1;
                if (next === TheEnd) {
                    Dialogues.isActive = false;
                    Dialogues.Rata.index = 0;
                    Dialogues.Rata.index += 1;
                    Dialogues.onComplete && Dialogues.onComplete(Dialogues.mainIndex);
                } else if (next === Yield) {
                    Dialogues.f = 0;
                    Dialogues.nextSpeaker = Dialogues.Patata;
                    Dialogues.Rata.index += 1;
                }
                return output;
            }
            return '...';
        }
    },

    isDone: () => {
        return !Dialogues.isActive;
    }

};