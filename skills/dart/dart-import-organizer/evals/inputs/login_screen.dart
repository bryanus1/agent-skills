// Copyright 2026 Example Corp.
import '../../../../core/utils/result.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'dart:async';
import 'package:my_app/features/auth/presentation/bloc/login_bloc.dart';
import 'package:flutter/material.dart';
import '../widgets/login_button.dart';
import 'dart:convert';
import 'package:flutter/widgets.dart' show Widget, BuildContext, Key;
import 'package:dio/dio.dart';
import 'dart:async';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final completer = Completer<void>();
    return BlocProvider(
      create: (_) => LoginBloc(),
      child: LoginButton(onPressed: completer.complete),
    );
  }
}
