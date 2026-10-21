// All on-screen text. To add a language, copy the "en" block and translate it.
window.TEXT = {
    en: {
        langButton: 'हिंदी',
        tagline: 'Field advice from real soil and weather data',
        cropLabel: 'Your crop',
        crops: { rice: 'Rice', wheat: 'Wheat', maize: 'Maize', cotton: 'Cotton', sugarcane: 'Sugarcane', millet: 'Millet', pulses: 'Pulses', vegetables: 'Vegetables' },
        waterTitle: 'Should I water?',
        waterButton: 'Check my field',
        photoTitle: 'Is my crop healthy?',
        photoButton: 'Take a photo',
        loading: 'Checking…',
        locating: 'Finding your location…',
        locationError: 'Could not get your location. Type it below (latitude, longitude).',
        manualPlaceholder: 'e.g. 28.61, 77.21',
        manualButton: 'Use',
        offline: 'No internet. Showing your last result.',
        savedAt: 'Saved',
        headline: {
            irrigate_now: 'Water today',
            irrigate_soon_1: 'Water tomorrow',
            irrigate_soon_n: 'Water in {n} days',
            wait: 'No need to water now'
        },
        amount: 'About {mm} mm ({mm} litres per square metre)',
        reason: {
            soil_dry: 'Soil moisture is {soil}%, below the {refill}% your {crop} needs.',
            will_dry: 'Soil is at {soil}%. Your {crop} will use {use} mm in 3 days and only {rain} mm rain is expected, so it will drop below {refill}%.',
            soil_wet: 'Soil is very wet ({soil}%). Watering now can harm the roots.',
            rain_coming: 'Soil is at {soil}% and {rain} mm rain is expected in the next 3 days.',
            enough_water: 'Soil moisture ({soil}%) is enough for the next 3 days.'
        },
        facts: { soil: 'Soil moisture', rain: 'Rain, next 3 days', use: 'Crop water use, 3 days', temp: 'Temperature now' },
        source: 'Data: {source}',
        status: { healthy: 'Looks healthy', problem: 'Possible problem', unsure: 'Not sure — try a closer, clearer photo' },
        notCrop: 'This does not look like a crop: {crop}. Take a photo of a leaf, stem or fruit.',
        confidence: 'Confidence: {pct}%',
        disclaimer: 'AI can be wrong. Before spraying chemicals, check with your local agriculture officer.',
        errorAdvice: 'Could not get field data. Please try again.',
        errorPhoto: 'Could not check the photo. Please try again.'
    },
    hi: {
        langButton: 'English',
        tagline: 'असली मिट्टी और मौसम डेटा से खेत की सलाह',
        cropLabel: 'आपकी फसल',
        crops: { rice: 'धान', wheat: 'गेहूं', maize: 'मक्का', cotton: 'कपास', sugarcane: 'गन्ना', millet: 'बाजरा', pulses: 'दालें', vegetables: 'सब्ज़ियाँ' },
        waterTitle: 'क्या सिंचाई करूँ?',
        waterButton: 'मेरा खेत जाँचें',
        photoTitle: 'क्या मेरी फसल स्वस्थ है?',
        photoButton: 'फ़ोटो लें',
        loading: 'जाँच हो रही है…',
        locating: 'आपकी जगह ढूँढ रहे हैं…',
        locationError: 'आपकी जगह नहीं मिली। नीचे लिखें (अक्षांश, देशांतर)।',
        manualPlaceholder: 'जैसे 28.61, 77.21',
        manualButton: 'इस्तेमाल करें',
        offline: 'इंटरनेट नहीं है। आपका पिछला नतीजा दिखा रहे हैं।',
        savedAt: 'सहेजा गया',
        headline: {
            irrigate_now: 'आज सिंचाई करें',
            irrigate_soon_1: 'कल सिंचाई करें',
            irrigate_soon_n: '{n} दिन में सिंचाई करें',
            wait: 'अभी सिंचाई की ज़रूरत नहीं'
        },
        amount: 'लगभग {mm} मिमी ({mm} लीटर प्रति वर्ग मीटर)',
        reason: {
            soil_dry: 'मिट्टी की नमी {soil}% है, जो आपकी {crop} फसल के लिए ज़रूरी {refill}% से कम है।',
            will_dry: 'मिट्टी की नमी {soil}% है। 3 दिन में आपकी {crop} फसल {use} मिमी पानी लेगी और सिर्फ़ {rain} मिमी बारिश की उम्मीद है, इसलिए नमी {refill}% से नीचे जाएगी।',
            soil_wet: 'मिट्टी बहुत गीली है ({soil}%)। अभी पानी देने से जड़ों को नुकसान हो सकता है।',
            rain_coming: 'मिट्टी की नमी {soil}% है और अगले 3 दिन में {rain} मिमी बारिश की उम्मीद है।',
            enough_water: 'मिट्टी की नमी ({soil}%) अगले 3 दिन के लिए काफ़ी है।'
        },
        facts: { soil: 'मिट्टी की नमी', rain: 'बारिश, अगले 3 दिन', use: 'फसल का पानी, 3 दिन', temp: 'अभी तापमान' },
        source: 'डेटा: {source}',
        status: { healthy: 'स्वस्थ दिखती है', problem: 'संभावित समस्या', unsure: 'पक्का नहीं — पास से साफ़ फ़ोटो लें' },
        notCrop: 'यह फसल नहीं लगती: {crop}। पत्ती, तने या फल की फ़ोटो लें।',
        confidence: 'भरोसा: {pct}%',
        disclaimer: 'AI गलत हो सकता है। रसायन छिड़कने से पहले अपने कृषि अधिकारी से पूछें।',
        errorAdvice: 'खेत का डेटा नहीं मिला। फिर कोशिश करें।',
        errorPhoto: 'फ़ोटो की जाँच नहीं हो सकी। फिर कोशिश करें।'
    }
};
