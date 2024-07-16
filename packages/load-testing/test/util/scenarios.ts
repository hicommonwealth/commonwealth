type ScenarioBaseOptions = {
  testFuncName: string;
  tags?: Record<string, string>;
};

type TrafficSpikeScenarioOptions = {
  allocatedVUs?: number;
};

type ConstantTrafficScenarioOptions = {
  rate?: number;
  allocatedVUs?: number;
};

type QuickDevScenarioOptions = {
  iterations?: number;
};

export function createScenario({
  options,
  trafficSpikeScenario,
  constantTrafficScenario,
  quickDevScenario,
}: {
  options: ScenarioBaseOptions;
  trafficSpikeScenario?: TrafficSpikeScenarioOptions;
  constantTrafficScenario?: TrafficSpikeScenarioOptions;
  quickDevScenario?: QuickDevScenarioOptions;
}) {
  if (__ENV.SCENARIO === 'spike')
    return createTrafficSpikeScenario({ ...options, ...trafficSpikeScenario });
  else if (__ENV.SCENARIO === 'constant')
    return createConstantTrafficScenario({
      ...options,
      ...constantTrafficScenario,
    });
  else return createQuickDevScenario({ ...options, ...quickDevScenario });
}

/**
 * This functions creates an open-model scenario with 3 stages that quickly ramps up traffic to simulate a spike in
 * traffic and then a gradual reduction in traffic back to more reasonable (but still above baseline) levels. For more
 * information on the executor for this scenario see the k6 docs:
 * https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/
 * @param testFuncName The name of the function to iterate over.
 * @param tags Tags to associate with the traffic spike scenario.
 * @param allocatedVUs The number of virtual users to allocate for the test function. If a single iteration is expected
 * to be performant allocate a lower number of VUs. If each iteration of the test function is very slow and iterations
 * are starting faster than VUs are being released (finishing an iteration) iterations will be dropped (won't run). See
 * the k6 documentation for info on VU allocation:
 * https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/arrival-rate-vu-allocation/
 */
export function createTrafficSpikeScenario({
  testFuncName,
  tags,
  allocatedVUs,
}: ScenarioBaseOptions & TrafficSpikeScenarioOptions) {
  return {
    executor: 'ramping-arrival-rate',
    tags,
    exec: testFuncName,

    // Start 50 (startRate) iterations per 30 seconds (timeUnit) - iterations will be started every 666 ms
    // as long as a VU is available
    startRate: 50,
    timeUnit: '30s',

    // a new iteration will only start if a VU is available
    preAllocatedVUs: allocatedVUs || 50,

    stages: [
      // start 50 iterations per 30 seconds for 1 minute - max 100 iterations
      { target: 50, duration: '1m' },

      // linearly ramp up to starting 200 iterations per 30 seconds over 2 minutes
      { target: 200, duration: '2m' },

      // linearly ramp down to starting 100 iterations per 30 seconds over 2 minutes
      { target: 100, duration: '2m' },
    ],
  };
}

/**
 * This function creates an open-model scenario to simulate constant traffic. This is the best scenario to use to
 * measure an accurate representation of requests per second. For more information on the executor for this scenario
 * see the k6 docs: https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/constant-arrival-rate/
 * @param testFuncName See the createTrafficSpikeScenario function
 * @param tags See the createTrafficSpikeScenario function
 * @param allocatedVUs See the createTrafficSpikeScenario function
 * @param rate The number of iterations to start per second. Defaults to 10.
 */
export function createConstantTrafficScenario({
  testFuncName,
  tags,
  allocatedVUs,
  rate,
}: ScenarioBaseOptions & ConstantTrafficScenarioOptions) {
  return {
    executor: 'constant-arrival-rate',
    tags,
    exec: testFuncName,

    // test will run for 1 minutes
    duration: '1m',

    // start 20 iterations every second as long as VUs are available - VUs are allocated fractionally so iterations
    // will start every rate / timeUnit (in the default case every 100ms)
    rate: rate || 10,
    timeUnit: '1s',

    preAllocatedVUs: 5,
    maxVUs: allocatedVUs || 50,
  };
}

/**
 * This function creates a scenario to be used during the development cycle only (further left). This scenario executes
 * an optionally specified number of test iterations as quickly as possible across 20 virtual users. If the iterations
 * cannot be completed in 30 seconds the test will exit without completing the remaining iterations. With the default
 * number of 100 iterations, if the iterations take longer than ~6 seconds the iterations will not complete. You can
 * estimate whether your iterations will complete by using the following equation:
 * (iterations / 20) * [avg iteration execution time in seconds] < 30
 * More info about this executor can be found in the k6 docs:
 * https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/shared-iterations/
 * @param testFuncName See the createTrafficSpikeScenario function
 * @param tags See the createTrafficSpikeScenario function
 * @param iterations The number of iterations to execute across 20 virtual users.
 */
export function createQuickDevScenario({
  testFuncName,
  tags,
  iterations,
}: ScenarioBaseOptions & QuickDevScenarioOptions) {
  return {
    executor: 'shared-iterations',
    exec: testFuncName,
    tags,
    vus: 20,
    iterations: iterations || 100,
    maxDuration: '30s',
  };
}
