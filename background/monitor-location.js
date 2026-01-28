export function trackLocationRequest(details) {
    const url = new URL(details.url);
    const requestDomain = url.hostname;

    // Possible location-related params/fields
    const locationKeywords = [
        'lat', 'latitude', 'lon', 'lng', 'longitude',
        'geo', 'geolocation', 'location', 'coords',
        'address', 'street', 'city', 'zip', 'postal', 'state', 'country'
    ];

    const locationData = {};

    //if (locationKeywords.some(keyword => url.href.includes(keyword))) {
    if (details.method === 'POST' || details.method === 'GET') {
       // console.log("LOCATION request check to", url.href, "fromData:", details.requestBody?.formData, "raw:", details.requestBody?.raw);

        // 1. Check URL query params
        for (const keyword of locationKeywords) {
            const value = url.searchParams.get(keyword);
            if (value) {
                locationData[keyword] = value;
            }
        }

        // 2. Check body (formData)
        if (details.requestBody?.formData) {
            for (const [key, val] of Object.entries(details.requestBody.formData)) {
                if (locationKeywords.includes(key.toLowerCase())) {
                    locationData[key] = val[0];
                }
            }
        }

        // 3. Check raw JSON body
        if (details.requestBody?.raw) {
            try {
                const decoder = new TextDecoder("utf-8");
                const bodyString = decoder.decode(details.requestBody.raw[0].bytes);

                // Try JSON parse
                const data = JSON.parse(bodyString);

                // Recursively search for keys that match location keywords
                function searchObj(obj) {
                    for (const [key, value] of Object.entries(obj)) {
                        if (locationKeywords.includes(key.toLowerCase())) {
                            locationData[key] = value;
                        } else if (typeof value === 'object' && value !== null) {
                            searchObj(value);
                        }
                    }
                }

                searchObj(data);

            } catch (e) {
                console.warn("Could not parse raw body as JSON:", e);
            }
        }

        // If found any location-related info, log it
        if (Object.keys(locationData).length > 0) {
            console.log("Location info sent to 3rd party:", requestDomain, locationData);
        }
    }
//}
}
