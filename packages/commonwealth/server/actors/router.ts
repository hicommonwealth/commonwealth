// helper utility that registers actions
// this is an adapter that maps the express request (req, body, etc) to the actor artifact, and then calls validate()
export const ExpressCommandRouter = () => {
  //(req, command) => {
  // TODO: map express req and other params to validate([]) above
  // actor validation
  // at this point, the actor for command is valid
  // execute the command
  // commandFn(actor, req.body);
  // as a developer, all I need to do is implement commandFn (actor:Actor, data:CommandSchema)
};
