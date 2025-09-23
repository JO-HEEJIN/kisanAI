// Utility functions for TerraData game
class Utils {
    static formatNumber(num, decimals = 2) {
        return Number(num.toFixed(decimals));
    }

    static formatPercent(value, decimals = 1) {
        return `${(value * 100).toFixed(decimals)}%`;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    static calculateArea(width, height) {
        return width * height;
    }

    static convertToAcres(squareMeters) {
        return squareMeters * 0.000247105; // 1 square meter = 0.000247105 acres
    }

    static convertToLiters(gallons) {
        return gallons * 3.78541; // 1 gallon = 3.78541 liters
    }

    static formatWaterUsage(liters) {
        if (liters < 1000) {
            return `${Math.round(liters)}L`;
        } else {
            return `${(liters / 1000).toFixed(1)}kL`;
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    static generateUID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
            return false;
        }
    }

    static loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
            return null;
        }
    }

    static calculateNDVIHealth(ndvi) {
        if (ndvi < 0.3) return 'poor';
        if (ndvi < 0.5) return 'moderate';
        if (ndvi < 0.7) return 'good';
        return 'excellent';
    }

    static calculateMoistureStatus(moisture) {
        if (moisture < 0.2) return 'drought';
        if (moisture < 0.4) return 'dry';
        if (moisture < 0.6) return 'optimal';
        if (moisture < 0.8) return 'wet';
        return 'saturated';
    }

    static calculateIrrigationNeed(ndvi, moisture) {
        const healthScore = ndvi * 10;
        const moistureScore = moisture * 10;
        const needScore = Math.max(0, 10 - healthScore - moistureScore);

        if (needScore > 7) return 'critical';
        if (needScore > 5) return 'high';
        if (needScore > 3) return 'moderate';
        return 'low';
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static calculateWeekFromDate(startDate, currentDate) {
        const start = new Date(startDate);
        const current = new Date(currentDate);
        const diffTime = Math.abs(current - start);
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        return diffWeeks;
    }

    static validateCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    static convertDMSToDD(degrees, minutes, seconds, direction) {
        let dd = degrees + minutes/60 + seconds/3600;
        if (direction === 'S' || direction === 'W') {
            dd = dd * -1;
        }
        return dd;
    }
}

// Color utilities for data visualization
class ColorUtils {
    static ndviColorScale(ndvi) {
        // Convert NDVI (-1 to 1) to RGB color
        ndvi = Utils.clamp(ndvi, -1, 1);

        if (ndvi < 0) {
            // Water/snow (blue)
            const intensity = Math.abs(ndvi);
            return `rgb(${Math.round(100 * (1 - intensity))}, ${Math.round(150 * (1 - intensity))}, 255)`;
        } else if (ndvi < 0.3) {
            // Bare soil to sparse vegetation (brown to yellow)
            const t = ndvi / 0.3;
            const r = Math.round(Utils.lerp(139, 255, t));
            const g = Math.round(Utils.lerp(69, 193, t));
            const b = Math.round(Utils.lerp(19, 7, t));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Vegetation (yellow to dark green)
            const t = (ndvi - 0.3) / 0.7;
            const r = Math.round(Utils.lerp(255, 46, t));
            const g = Math.round(Utils.lerp(193, 125, t));
            const b = Math.round(Utils.lerp(7, 50, t));
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    static moistureColorScale(moisture) {
        // Convert soil moisture (0 to 1) to color scale
        moisture = Utils.clamp(moisture, 0, 1);

        if (moisture < 0.2) {
            // Very dry (red)
            return '#D32F2F';
        } else if (moisture < 0.4) {
            // Dry (orange)
            const t = (moisture - 0.2) / 0.2;
            const r = Math.round(Utils.lerp(211, 255, t));
            const g = Math.round(Utils.lerp(47, 152, t));
            const b = Math.round(Utils.lerp(47, 34, t));
            return `rgb(${r}, ${g}, ${b})`;
        } else if (moisture < 0.6) {
            // Optimal (yellow to light green)
            const t = (moisture - 0.4) / 0.2;
            const r = Math.round(Utils.lerp(255, 139, t));
            const g = Math.round(Utils.lerp(152, 195, t));
            const b = Math.round(Utils.lerp(34, 74, t));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Wet to saturated (green to blue)
            const t = (moisture - 0.6) / 0.4;
            const r = Math.round(Utils.lerp(139, 33, t));
            const g = Math.round(Utils.lerp(195, 150, t));
            const b = Math.round(Utils.lerp(74, 243, t));
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

// Animation utilities
class AnimationUtils {
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeIn(t) {
        return t * t;
    }

    static easeOut(t) {
        return t * (2 - t);
    }

    static animate(duration, callback, easingFunction = AnimationUtils.easeInOut) {
        const startTime = performance.now();

        function frame(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = easingFunction(progress);

            callback(easedProgress);

            if (progress < 1) {
                requestAnimationFrame(frame);
            }
        }

        requestAnimationFrame(frame);
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';

        AnimationUtils.animate(duration, (progress) => {
            element.style.opacity = progress.toString();
        });
    }

    static fadeOut(element, duration = 300, callback = null) {
        AnimationUtils.animate(duration, (progress) => {
            element.style.opacity = (1 - progress).toString();
        });

        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, duration);
    }
}

// Export utilities globally
window.Utils = Utils;
window.ColorUtils = ColorUtils;
window.AnimationUtils = AnimationUtils;