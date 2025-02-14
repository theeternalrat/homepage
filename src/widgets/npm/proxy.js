import getServiceWidget from "utils/config/service-helpers";
import { formatApiCall } from "utils/proxy/api-helpers";
import widgets from "widgets/widgets";

export default async function npmProxyHandler(req, res) {
  const { group, service, endpoint } = req.query;

  if (group && service) {
    const widget = await getServiceWidget(group, service);

    if (!widgets?.[widget.type]?.api) {
      return res.status(403).json({ error: "Service does not support API calls" });
    }

    if (widget) {
      const url = new URL(formatApiCall(widgets[widget.type].api, { endpoint, ...widget }));

      const loginUrl = `${widget.url}/api/tokens`;
      const body = { identity: widget.username, secret: widget.password };

      const authResponse = await fetch(loginUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((response) => response.json());

      const apiResponse = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authResponse.token}`,
        },
      }).then((response) => response.json());

      return res.send(apiResponse);
    }
  }

  return res.status(400).json({ error: "Invalid proxy service type" });
}
