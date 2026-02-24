// questions.js - ملف الأسئلة المنفصل
const QUESTIONS = [
    { normal: "أفضل وقت في اليوم؟", imposter: "أسوأ وقت في اليوم؟" },
    { normal: "أفضل جو في السنة؟", imposter: "أسوأ جو في السنة؟" },
    { normal: "أفضل رائحة؟", imposter: "أسوأ رائحة؟" },
    { normal: "أفضل ذكرى؟", imposter: "أسوأ ذكرى؟" },
    { normal: "أول شيء تسويه لما تصحى؟", imposter: "آخر شيء تسويه قبل النوم؟" },
    { normal: "شي تسويه لوحدك؟", imposter: "شي تسويه مع العائلة؟" },
    { normal: "مكان تحلم تزوره؟", imposter: "مكان ما تبي تزوره؟" },
    { normal: "مهنة تحلم فيها؟", imposter: "أسوأ مهنة؟" },
    { normal: "موقف ضحكت فيه كثير؟", imposter: "موقف بكيت فيه؟" },
    { normal: "أحرج موقف صار لك؟", imposter: "أسعد موقف صار لك؟" },
    { normal: "أكلة تحبها؟", imposter: "أكلة تكرهها؟" },
    { normal: "لون تلبسه كثير؟", imposter: "لون ما تحب تلبسه؟" },
    { normal: "حيوان تحبه؟", imposter: "حيوان تخاف منه؟" },
    { normal: "رياضة تلعبها؟", imposter: "رياضة تشوفها مملة؟" },
    { normal: "فنان تسمعه؟", imposter: "فنان ما تحب صوته؟" },
    { normal: "مسلسل تابعته؟", imposter: "مسلسل ما كملته؟" },
    { normal: "كتاب قريته؟", imposter: "كتاب ملخصه يكفي؟" },
    { normal: "مكان تروح له باستمرار؟", imposter: "مكان تروح له مرة بالسنة؟" },
    { normal: "عادة تسويها بالعيد؟", imposter: "عادة تسويها بالاجازة؟" },
    { normal: "شي تتمنى تشتريه؟", imposter: "شي شريته وندمت عليه؟" }
];

// دالة لاختيار سؤال عشوائي
function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    return QUESTIONS[randomIndex];
}

// دالة لإضافة سؤال جديد (مفيدة للتطوير)
function addQuestion(normalQuestion, imposterQuestion) {
    QUESTIONS.push({
        normal: normalQuestion,
        imposter: imposterQuestion
    });
}