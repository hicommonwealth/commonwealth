import { ThreadAttributes } from '../../models/thread';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateThreadRequestBody = {
  topic_id: string;
  topic_name: string;
  title: string;
  body: string;
  kind: string;
  stage: string;
  url?: string;
  readOnly: boolean;
  canvas_action?: any;
  canvas_session?: any;
  canvas_hash?: any;
};
type CreateThreadResponse = ThreadAttributes;

export const createThreadHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateThreadRequestBody>,
  res: TypedResponse<CreateThreadResponse>
) => {
  const { user, address, chain } = req;
  const {
    topic_id: topicId,
    topic_name: topicName,
    title,
    body,
    kind,
    stage,
    url,
    readOnly,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  } = req.body;

  const attachments = req.body['attachments[]'];

  const [thread, notificationOptions, analyticsOptions] =
    await controllers.threads.createThread({
      user,
      address,
      chain,
      title,
      body,
      kind,
      readOnly,
      topicId: parseInt(topicId, 10) || undefined,
      topicName,
      stage,
      url,
      attachments,
      canvasAction,
      canvasSession,
      canvasHash,
    });

  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  controllers.analytics.track(analyticsOptions);

  return success(res, thread);
};
