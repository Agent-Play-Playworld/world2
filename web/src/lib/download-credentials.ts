type DownloadCitizenshipCredentialsOptions = {
  nodeId: string;
  passw: string;
  serverUrl: string;
};

export const downloadCitizenshipCredentials = (
  options: DownloadCitizenshipCredentialsOptions
): void => {
  const payload = {
    serverUrl: options.serverUrl.replace(/\/$/, ""),
    nodeId: options.nodeId,
    passw: options.passw,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "credentials.json";
  anchor.rel = "noreferrer";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};
