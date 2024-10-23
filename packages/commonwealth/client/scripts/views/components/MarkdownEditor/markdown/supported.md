
# Markdown Rendering Tests

This just tests all the major markdown features we want to support.

# Header 1

## Header 2

## Header 3

# Link types

https://www.youtube.com/watch?v=eRBOgtp0Hac

https://x.com/venturetwins/status/1835366788433051677

https://twitter.com/venturetwins/status/1835366788433051677

# Images

![Do Not Taunt Happy Fun Ball](https://upload.wikimedia.org/wikipedia/en/6/65/Happy_fun_ball.jpg "Happy Fun Ball")

# Paragraphs

This is the first paragraph.

This is the second.

World War II or the Second World War (1 September 1939 – 2 September 1945) was a global conflict between two coalitions: the Allies and the Axis powers. Nearly all of the world's countries—including all the great powers—participated, with many investing all available economic, industrial, and scientific capabilities in pursuit of total war, blurring the distinction between military and civilian resources. Tanks and aircraft played major roles, with the latter enabling the strategic bombing of population centres and delivery of the only two nuclear weapons ever used in war. World War II was the deadliest conflict in history, resulting in 70 to 85 million fatalities, more than half of which were civilians. Millions died in genocides, including the Holocaust of European Jews, and by massacres, starvation, and disease. Following the Allied powers' victory, Germany, Austria, Japan, and Korea were occupied, and war crimes tribunals were conducted against German and Japanese leaders.

# Formatting

~~Strikethrough~~

<s>Strikethrough (within s HTML tag)</s>

*Italic*     
_Italic using underscores_

**Emphasis**  
__Emphasis using underscores__

***Emphasis Italic*** 
___Emphasis Italic using underscores___

Subscript: X<sub>2</sub>
Superscript: O<sup>2</sup>

# Code Blocks

```js
function main() {
  console.log('hello world')
}
```

# Bullets

Regular bullet points: 

- first point 
- second point

Numbered bullet points: 

1. first
2. second


# Basic table support

| foo | bar |
| --- | --- |
| baz | bim |

# Quotes

> Four score and seven years ago our fathers brought forth on this continent, a
> new nation, conceived in Liberty, and dedicated to the proposition that all men
> are created equal. 

> Now we are engaged in a great civil war, testing whether that nation, or any 
> nation so conceived and so dedicated, can long endure. We are met on a great 
> battle-field of that war. We have come to dedicate a portion of that field, 
> as a final resting place for those who here gave their lives that that nation 
> might live. It is altogether fitting and proper that we should do this.


