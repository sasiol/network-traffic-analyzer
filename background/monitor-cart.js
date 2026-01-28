
//see if the request contains cart related keywords
//then try to find the product name 
export function trackCartRequest(details) {
  
    const url = new URL(details.url);
    const requestDomain = url.hostname; 

    const cartKeywords = ['addtocart', 'ADD_CART', 'shoppingcart', 'Add-to-cart','add-to-cart', 'AddToCart', 'add_to_cart']; 
    const productName=[];
    const productKeywords = ['value', 'pr1', 'user_event', 'tiba']; 

    if (cartKeywords.some(keyword => url.href.includes(keyword))) {

      if (details.method === 'POST'|| details.method === 'GET') {
        //fromData and raw included for debugging
        console.log("CART request to ", url.href, " fromData:", details.requestBody?.formData, "raw:", details.requestBody?.raw); 
        
        //try to get product info from raw request body
        if(details.requestBody?.raw){
            const decoder = new TextDecoder("utf-8");
            const bodyString = decoder.decode(details.requestBody.raw[0].bytes);
            console.log("Raw decoded body string:", bodyString);
            const data = JSON.parse(bodyString);

            //if it contains a list go through it
            if (Array.isArray(data.products)) {
             data.products.forEach((product) => {
            productName.push(product.name);
             });
             } else {
          console.log("No products array found in payload.");
           
            }

      
        }
          //try to find product name from url
            for ( const keyword of productKeywords) {
            const productValue = url.searchParams.get(keyword);
            if (productValue) {
                productName.push(productValue);
                }
            }
          
          console.log("Products added to cart - 3rd party:", requestDomain, "Products:", productName, "details:", details);
         
     }
     console.log("sending cart details", details)
     return productName;
    }
  return null;
}
