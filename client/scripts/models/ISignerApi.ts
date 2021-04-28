interface ISignerApi {
  updateSigner: (address: string) => void;
  init: () => Promise<void>;
}

export default ISignerApi;
