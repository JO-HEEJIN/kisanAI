// Simple AR Functions Test
console.log('🔄 Loading SIMPLE AR functions...');
console.log('📍 ar-functions-simple.js: Script is executing');

// Test window object
if (typeof window !== 'undefined') {
    console.log('✅ ar-functions-simple.js: Window object available');
} else {
    console.error('❌ ar-functions-simple.js: No window object!');
}

// Simple AR function
console.log('🎯 Defining simple window.launchRealAR function...');
window.launchRealAR = async function() {
    console.log('🚀 Simple launchRealAR function called!');
    alert('🎯 Simple AR function works!');
};

// Confirm function is loaded
console.log('✅ Simple AR function loaded:', typeof window.launchRealAR);