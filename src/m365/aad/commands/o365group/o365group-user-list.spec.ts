import * as assert from 'assert';
import * as sinon from 'sinon';
import { telemetry } from '../../../../telemetry';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import request from '../../../../request';
import { pid } from '../../../../utils/pid';
import { session } from '../../../../utils/session';
import { sinonUtil } from '../../../../utils/sinonUtil';
import commands from '../../commands';
const command: Command = require('./o365group-user-list');

describe(commands.O365GROUP_USER_LIST, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(telemetry, 'trackEvent').callsFake(() => { });
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    sinon.stub(session, 'getId').callsFake(() => '');
    auth.service.connected = true;
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
    loggerLogSpy = sinon.spy(logger, 'log');
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      telemetry.trackEvent,
      pid.getProcessName,
      session.getId
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.O365GROUP_USER_LIST), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the groupId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        groupId: 'not-c49b-4fd4-8223-28f0ac3a6402'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when invalid role specified', async () => {
    const actual = await command.validate({
      options: {
        groupId: '6703ac8a-c49b-4fd4-8223-28f0ac3a6402',
        role: 'Invalid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when valid groupId and no role specified', async () => {
    const actual = await command.validate({
      options: {
        groupId: '6703ac8a-c49b-4fd4-8223-28f0ac3a6402'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid groupId and Owner role specified', async () => {
    const actual = await command.validate({
      options: {
        groupId: '6703ac8a-c49b-4fd4-8223-28f0ac3a6402',
        role: 'Owner'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid groupId and Member role specified', async () => {
    const actual = await command.validate({
      options: {
        groupId: '6703ac8a-c49b-4fd4-8223-28f0ac3a6402',
        role: 'Member'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid groupId and Guest role specified', async () => {
    const actual = await command.validate({
      options: {
        groupId: '6703ac8a-c49b-4fd4-8223-28f0ac3a6402',
        role: 'Guest'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('correctly lists all users in a Microsoft 365 group', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/owners?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [{ "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" }]
        });
      }
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/members?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [
            { "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" },
            { "id": "00000000-0000-0000-0000-000000000001", "displayName": "Karl Matteson", "userPrincipalName": "karl.matteson@contoso.onmicrosoft.com", "userType": "Member" }
          ]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { groupId: "00000000-0000-0000-0000-000000000000" } });
    assert(loggerLogSpy.calledWith([
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Anne Matthews",
        "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com",
        "userType": "Owner"
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Anne Matthews",
        "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com",
        "userType": "Member"
      },
      {
        "id": "00000000-0000-0000-0000-000000000001",
        "displayName": "Karl Matteson",
        "userPrincipalName": "karl.matteson@contoso.onmicrosoft.com",
        "userType": "Member"
      }
    ]));
  });

  it('correctly lists all owners in a Microsoft 365 group', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/owners?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [{ "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" }]
        });
      }
      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { groupId: "00000000-0000-0000-0000-000000000000", role: "Owner" } });
    assert(loggerLogSpy.calledWith([
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Anne Matthews",
        "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com",
        "userType": "Owner"
      }
    ]));
  });

  it('correctly lists all members in a Microsoft 365 group', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/owners?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [{ "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" }]
        });
      }
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/members?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [
            { "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" },
            { "id": "00000000-0000-0000-0000-000000000001", "displayName": "Karl Matteson", "userPrincipalName": "karl.matteson@contoso.onmicrosoft.com", "userType": "Member" }
          ]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { groupId: "00000000-0000-0000-0000-000000000000", role: "Member" } });
    assert(loggerLogSpy.calledWith([
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Anne Matthews",
        "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com",
        "userType": "Member"
      },
      {
        "id": "00000000-0000-0000-0000-000000000001",
        "displayName": "Karl Matteson",
        "userPrincipalName": "karl.matteson@contoso.onmicrosoft.com",
        "userType": "Member"
      }
    ]));
  });

  it('correctly lists all users in a Microsoft 365 group (debug)', async () => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/owners?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [{ "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" }]
        });
      }
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/00000000-0000-0000-0000-000000000000/members?$select=id,displayName,userPrincipalName,userType`) {
        return Promise.resolve({
          "value": [
            { "id": "00000000-0000-0000-0000-000000000000", "displayName": "Anne Matthews", "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com", "userType": "Member" },
            { "id": "00000000-0000-0000-0000-000000000001", "displayName": "Karl Matteson", "userPrincipalName": "karl.matteson@contoso.onmicrosoft.com", "userType": "Member" }
          ]
        });
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, { options: { debug: true, groupId: "00000000-0000-0000-0000-000000000000" } });
    assert(loggerLogSpy.calledWith([
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Anne Matthews",
        "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com",
        "userType": "Owner"
      },
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Anne Matthews",
        "userPrincipalName": "anne.matthews@contoso.onmicrosoft.com",
        "userType": "Member"
      },
      {
        "id": "00000000-0000-0000-0000-000000000001",
        "displayName": "Karl Matteson",
        "userPrincipalName": "karl.matteson@contoso.onmicrosoft.com",
        "userType": "Member"
      }
    ]));
  });

  it('correctly handles error when listing users', async () => {
    sinon.stub(request, 'get').callsFake(() => {
      return Promise.reject('An error has occurred');
    });

    await assert.rejects(command.action(logger, { options: { groupId: "00000000-0000-0000-0000-000000000000" } } as any),
      new CommandError('An error has occurred'));
  });
});
