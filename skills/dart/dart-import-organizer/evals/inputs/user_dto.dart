part 'user_dto.g.dart';
import 'package:json_annotation/json_annotation.dart';
export 'package:my_app/features/auth/domain/entities/user.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
part 'user_dto.freezed.dart';
import 'package:my_app/features/auth/domain/entities/user.dart';

@freezed
class UserDto with _$UserDto {
  const factory UserDto({required String id, required String email}) = _UserDto;

  factory UserDto.fromJson(Map<String, dynamic> json) => _$UserDtoFromJson(json);

  User toEntity() => User(id: id, email: email);
}
