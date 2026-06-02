import { describe, it, expect } from 'vitest';
import {
  FigureGender,
  FigurePartType,
  GameDataType,
  HabboHotel,
  HabboResource,
  HttpMethod,
  SkillType,
} from '../enums.js';

describe('HabboHotel', () => {
  it('has the correct domain suffix values', () => {
    expect(HabboHotel.COM).toBe('com');
    expect(HabboHotel.BR).toBe('com.br');
    expect(HabboHotel.DE).toBe('de');
    expect(HabboHotel.ES).toBe('es');
    expect(HabboHotel.FI).toBe('fi');
    expect(HabboHotel.FR).toBe('fr');
    expect(HabboHotel.IT).toBe('it');
    expect(HabboHotel.NL).toBe('nl');
    expect(HabboHotel.TR).toBe('com.tr');
  });
});

describe('SkillType', () => {
  it('has the correct API string values', () => {
    expect(SkillType.Fishing).toBe('FISHING');
  });
});

describe('GameDataType', () => {
  it('has the correct path segment values', () => {
    expect(GameDataType.FigureData).toBe('figuredata');
    expect(GameDataType.ProductData).toBe('productdata');
    expect(GameDataType.FurniDataXml).toBe('furnidata_xml');
    expect(GameDataType.ExternalVariables).toBe('external_variables');
  });
});

describe('HttpMethod', () => {
  it('has the correct HTTP verb values', () => {
    expect(HttpMethod.GET).toBe('GET');
    expect(HttpMethod.POST).toBe('POST');
  });
});

describe('FigureGender', () => {
  it('has correct string values', () => {
    expect(FigureGender.Male).toBe('M');
    expect(FigureGender.Female).toBe('F');
    expect(FigureGender.Unisex).toBe('U');
  });
});

describe('FigurePartType', () => {
  it('has correct string values for key part types', () => {
    expect(FigurePartType.Hair).toBe('hr');
    expect(FigurePartType.HairBelow).toBe('hrb');
    expect(FigurePartType.Head).toBe('hd');
    expect(FigurePartType.Chest).toBe('ch');
    expect(FigurePartType.Legs).toBe('lg');
    expect(FigurePartType.Shoes).toBe('sh');
    expect(FigurePartType.Hat).toBe('ha');
    expect(FigurePartType.HeadAccessory).toBe('he');
    expect(FigurePartType.EarAccessory).toBe('ea');
    expect(FigurePartType.Eyes).toBe('ey');
    expect(FigurePartType.FaceAccessory).toBe('fa');
    expect(FigurePartType.Face).toBe('fc');
    expect(FigurePartType.ChestAccessory).toBe('ca');
    expect(FigurePartType.Coat).toBe('cc');
    expect(FigurePartType.ChestPrint).toBe('cp');
    expect(FigurePartType.WaistAccessory).toBe('wa');
    expect(FigurePartType.Body).toBe('bd');
    expect(FigurePartType.LeftHandItem).toBe('lc');
  });
});

describe('HabboResource', () => {
  it('has the correct resource name values', () => {
    expect(HabboResource.User).toBe('user');
    expect(HabboResource.Group).toBe('group');
    expect(HabboResource.Room).toBe('room');
    expect(HabboResource.Badge).toBe('badge');
    expect(HabboResource.Achievement).toBe('achievement');
    expect(HabboResource.Match).toBe('match');
    expect(HabboResource.Derby).toBe('derby');
    expect(HabboResource.Player).toBe('player');
  });
});
