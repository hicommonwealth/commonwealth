import { useRef } from 'react';

const ENABLED = true

function isLocal() {
  return ["localhost", "127.0.0.1"].includes(document.location.hostname)
}

export const ErrorWatcher() {

  const errorRef = useRef()



}


