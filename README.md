# Network Traffic Privacy Analyzer

An experimental browser extension developed as part of IDA project / Master's thesis that inspects website's third-party traffic and privacy policies. 
Goal is to have LLM analyse the privacy policies and traffic for potential sensitive data leaks. 


## Current Features

- Captures third-party HTTP requests made by web pages
- Extracts URLs and request metadata for analysis
- Searches for website's privacy policy from links
- Extracts the text from privacy policy
- Sends collected data for LLM-based analysis via a local Python backend service (not included in this repository) that communicates with a university-hosted LLM server

