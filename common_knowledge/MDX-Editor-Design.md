
# 1. What’s the current status of the MDX editor implementation?

It was ready go to but at the last minute, we realize that we needed @mentions 
for users along with auto-complete.

So basically, you say want to 'at' mention Alice so you start typing @Alice and 
it auto-completes.

Lexical supported that, but it was not supported by MDXEditor. 

I tried to implement it but ran into problems.

# 2. What features or parts were finished and are working as intended?

All, most of it is finished.

# 3. Why was the implementation paused or not fully completed?

Yes. Just this last like 5% ... Maybe development has moved forward and it's now
easier to fix.

The problem I ran into was Lexical and markdown weren't syncing properly 
and you could create the mention, just not save it.

# 4. What remains to be done to finish the MDX editor project? Are there any blockers?

Mentioned above.

# 5. Is there any kind of content validation or sanitization done before rendering or saving markdown?

Internally, yes.  It uses a standard markdown parser which converts the markdown
DOM to a Lexical DOM (and vice versa).

I was pretty happy with it but just didn't support 'at' mentions.
