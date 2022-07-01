# Attempts to start the existing docker container on the given port.

# First check if the port is still available. If it is, start the container. If it fails move to step 2.
# If the port is not available or if the port is taken by the time the container attempts to start then re-map the ports
