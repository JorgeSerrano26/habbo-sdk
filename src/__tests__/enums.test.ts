import { describe, it, expect } from 'vitest';
import {
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
