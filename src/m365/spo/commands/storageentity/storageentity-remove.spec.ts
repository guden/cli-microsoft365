import * as assert from 'assert';
import * as sinon from 'sinon';
import { telemetry } from '../../../../telemetry';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import config from '../../../../config';
import request from '../../../../request';
import { pid } from '../../../../utils/pid';
import { session } from '../../../../utils/session';
import { sinonUtil } from '../../../../utils/sinonUtil';
import { spo } from '../../../../utils/spo';
import commands from '../../commands';
const command: Command = require('./storageentity-remove');

describe(commands.STORAGEENTITY_REMOVE, () => {
  let log: string[];
  let logger: Logger;
  let promptOptions: any;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(telemetry, 'trackEvent').callsFake(() => { });
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    sinon.stub(session, 'getId').callsFake(() => '');
    sinon.stub(spo, 'getRequestDigest').callsFake(() => Promise.resolve({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    }));
    auth.service.connected = true;
    auth.service.spoUrl = 'https://contoso.sharepoint.com';
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    sinon.stub(Cli, 'prompt').callsFake(async (options) => {
      promptOptions = options;
      return { continue: false };
    });
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      Cli.prompt
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      spo.getRequestDigest,
      telemetry.trackEvent,
      pid.getProcessName,
      session.getId
    ]);
    auth.service.connected = false;
    auth.service.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.STORAGEENTITY_REMOVE), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('removes existing tenant property without prompting with confirmation argument', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake((opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return Promise.resolve(JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]));
      }
      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { key: 'existingproperty', confirm: true, appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="31" ObjectPathId="30" /><ObjectPath Id="33" ObjectPathId="32" /><ObjectPath Id="35" ObjectPathId="34" /><Method Name="RemoveStorageEntity" Id="36" ObjectPathId="34"><Parameters><Parameter Type="String">existingproperty</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="30" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="32" ParentId="30" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="34" ParentId="32" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('prompts before removing tenant property when confirmation argument not passed', async () => {

    await command.action(logger, { options: { debug: true, key: 'existingproperty', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    let promptIssued = false;

    if (promptOptions && promptOptions.type === 'confirm') {
      promptIssued = true;
    }
    assert(promptIssued);
  });

  it('aborts removing property when prompt not confirmed', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake(() => {
      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { debug: true, key: 'existingproperty', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert(postStub.notCalled);
  });

  it('removes tenant property when prompt confirmed', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake((opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return Promise.resolve(JSON.stringify([{ "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": null, "TraceCorrelationId": "4456299e-d09e-4000-ae61-ddde716daa27" }, 31, { "IsNull": false }, 33, { "IsNull": false }, 35, { "IsNull": false }]));
      }
      return Promise.reject('Invalid request');
    });

    sinonUtil.restore(Cli.prompt);
    sinon.stub(Cli, 'prompt').callsFake(async () => (
      { continue: true }
    ));

    await command.action(logger, { options: { debug: true, key: 'existingproperty', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } });
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="31" ObjectPathId="30" /><ObjectPath Id="33" ObjectPathId="32" /><ObjectPath Id="35" ObjectPathId="34" /><Method Name="RemoveStorageEntity" Id="36" ObjectPathId="34"><Parameters><Parameter Type="String">existingproperty</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="30" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="32" ParentId="30" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="34" ParentId="32" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('correctly reports when trying to remove an nonexistent property', async () => {
    const postStub: sinon.SinonStub = sinon.stub(request, 'post').callsFake((opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1) {
        return Promise.resolve(JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7018.1204", "ErrorInfo": {
              "ErrorMessage": "File Not Found.", "ErrorValue": null, "TraceCorrelationId": "9e54299e-208a-4000-8546-cc4139091b26", "ErrorCode": -2147024894, "ErrorTypeName": "System.IO.FileNotFoundException"
            }, "TraceCorrelationId": "9e54299e-208a-4000-8546-cc4139091b26"
          }
        ]));
      }

      return Promise.reject('Invalid request');
    });

    sinonUtil.restore(Cli.prompt);
    sinon.stub(Cli, 'prompt').callsFake(async () => (
      { continue: true }
    ));

    await assert.rejects(command.action(logger, { options: { debug: true, key: 'nonexistentproperty', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } } as any), new CommandError('File Not Found.'));
    assert.strictEqual(postStub.lastCall.args[0].url, 'https://contoso-admin.sharepoint.com/_vti_bin/client.svc/ProcessQuery');
    assert.strictEqual(postStub.lastCall.args[0].headers['X-RequestDigest'], 'ABC');
    assert.strictEqual(postStub.lastCall.args[0].data, `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="31" ObjectPathId="30" /><ObjectPath Id="33" ObjectPathId="32" /><ObjectPath Id="35" ObjectPathId="34" /><Method Name="RemoveStorageEntity" Id="36" ObjectPathId="34"><Parameters><Parameter Type="String">nonexistentproperty</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="30" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /><Method Id="32" ParentId="30" Name="GetSiteByUrl"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/appcatalog</Parameter></Parameters></Method><Property Id="34" ParentId="32" Name="RootWeb" /></ObjectPaths></Request>`);
  });

  it('requires app catalog URL', () => {
    const options = command.options;
    let requiresAppCatalogUrl = false;
    options.forEach(o => {
      if (o.option.indexOf('<appCatalogUrl>') > -1) {
        requiresAppCatalogUrl = true;
      }
    });
    assert(requiresAppCatalogUrl);
  });

  it('supports suppressing confirmation prompt', () => {
    const options = command.options;
    let containsConfirmOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--confirm') > -1) {
        containsConfirmOption = true;
      }
    });
    assert(containsConfirmOption);
  });

  it('requires tenant property name', () => {
    const options = command.options;
    let requiresTenantPropertyName = false;
    options.forEach(o => {
      if (o.option.indexOf('<key>') > -1) {
        requiresTenantPropertyName = true;
      }
    });
    assert(requiresTenantPropertyName);
  });

  it('accepts valid SharePoint Online app catalog URL', async () => {
    const actual = await command.validate({ options: { appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog', key: 'prop' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('accepts valid SharePoint Online site URL', async () => {
    const actual = await command.validate({ options: { appCatalogUrl: 'https://contoso.sharepoint.com', key: 'prop' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('rejects invalid SharePoint Online URL', async () => {
    const url = 'http://contoso';
    const actual = await command.validate({ options: { appCatalogUrl: url, key: 'prop' } }, commandInfo);
    assert.strictEqual(actual, `${url} is not a valid SharePoint Online site URL`);
  });

  it('fails validation when no SharePoint Online app catalog URL specified', async () => {
    const actual = await command.validate({ options: {} }, commandInfo);
    assert.strictEqual(actual, 'Required option appCatalogUrl not specified');
  });

  it('handles promise rejection', async () => {
    sinonUtil.restore(spo.getRequestDigest);
    sinon.stub(spo, 'getRequestDigest').callsFake(() => Promise.reject('getRequestDigest error'));

    sinonUtil.restore(Cli.prompt);
    sinon.stub(Cli, 'prompt').callsFake(async () => (
      { continue: true }
    ));

    await assert.rejects(command.action(logger, { options: { debug: true, key: 'nonexistentproperty', appCatalogUrl: 'https://contoso.sharepoint.com/sites/appcatalog' } } as any), new CommandError('getRequestDigest error'));
  });
});
