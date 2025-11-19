### GrokCap: Capture Text as Plain Text or SSML

This repository features a bookmarklet, GrokCap, designed to extract conversational text from a webpage and format it into either clean plain text or Speech Synthesis Markup Language (SSML), optimized for text-to-speech services like Amazon Polly.

##### What is a Bookmarklet?

A bookmarklet is a small piece of JavaScript code saved as a bookmark in your web browser. When you click the bookmark, instead of navigating to a new webpage, the code runs on the webpage you are currently viewing, allowing it to interact with or change the page's content.

GrokCap is a tool that appears in your browser's bookmark bar and, when clicked, opens a pop-up window to display and allow copying of the page's content in various formats.

### Using the GrokCap Bookmarklet

Drag the link on this linked page to your bookmarks bar:  

Go here: [GrokCap Bookmarklet](https://mscalora.github.io/GrokCap/GrokCap-Bookmark.html)

Use code with caution. The sourcecode for the bookmarklet is included in the repository, 
the bookmarklet is a encoded and optimized version created with an online bookmarklet tool, 
here is the link to the tool I used:

Bookmarklet Tool: [Bookmarkleter](https://chriszarate.github.io/bookmarkleter/) [src](https://github.com/chriszarate/bookmarkleter)

If you are super paranoid, you should examine the src code for both **this bookmarklet** and the **bookmarkleter** and then build both from scratch.

### How to use it:

* Ensure your bookmarks bar is visible in your browser's settings.
* Drag the "GrokCap" link from the raw HTML above directly into your bookmarks bar.
* Navigate to the grok chat containing response or request text you wish to capture.
* Click the "GrokCap" bookmarklet in your bar. A pop-up window will appear with the extracted content.
* Use the buttons in the pop-up to toggle between Plain Text and SSML formats, switch between Requests and Responses, copy the content to your clipboard, or save (download) it as a text file.

### Demonstration Video

Watch linked YouTube video or the GrokCap.mov video file included in this repository for a live demonstration of the bookmarklet in action.

Demo on YouTube: [Demo](https://www.youtube.com/shorts/ycs-mMwXhow)

<video 
  src="GrokCap.mp4" 
  controls
  autoplay 
  muted 
  loop 
  style="width: calc(100vh - 20px)"
  playsinline>
</video>
