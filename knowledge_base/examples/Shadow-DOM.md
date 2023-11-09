# Shadow DOM

```ts
class ShadowSubtreeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const shadowRoot = this.ref.current.createShadowRoot();
    // Add child elements to the Shadow DOM subtree
  }

  render() {
    return <div ref={this.ref} />;
  }
}
```

## Change Log

- 230216: Authored by Forest Mars.
